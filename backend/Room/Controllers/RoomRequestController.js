const RoomRequest = require('../Models/RoomRequestModel');
const Room = require('../Models/RoomModel');
const emailService = require('../../Services/EmailService');

// Get all room requests (with filtering)
exports.getAllRoomRequests = async (req, res) => {
  try {
    // Build filter object
    let filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.roomId) {
      filter.roomId = req.query.roomId;
    }
    
    if (req.query.isTransfer) {
      filter.isTransferRequest = req.query.isTransfer === 'true';
    }
    
    // Get requests with filters and populate room details
    const requests = await RoomRequest.find(filter)
      .populate('roomId', 'roomNumber roomId property status')
      .sort({ requestDate: -1 });
    
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    console.error('Error getting room requests:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new room request
exports.createRoomRequest = async (req, res) => {
  try {
    const { userId, roomId, name, email, phone, photo, reason, notes, moveInDate } = req.body;
    
    // Create the room request with the hardcoded user data from context
    const request = await RoomRequest.create({
      userId,
      roomId,
      name,
      email,
      phone,
      photo,
      reason,
      notes,
      moveInDate,
      requestDate: new Date(),
      status: 'pending'
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error creating room request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get room request by ID
exports.getRoomRequest = async (req, res) => {
  try {
    const request = await RoomRequest.findById(req.params.id)
      .populate('roomId', 'roomNumber roomId property status');
    
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room request not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update room request
exports.updateRoomRequest = async (req, res) => {
  try {
    // Don't allow updating the status directly through this endpoint
    if (req.body.status) {
      delete req.body.status;
    }
    
    const request = await RoomRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room request not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Approve room request
exports.approveRoomRequest = async (req, res) => {
  try {
    // Change this line from requestId to id
    const { id } = req.params;  // Use id instead of requestId
    const { message } = req.body;
    
    // Get the request
    const request = await RoomRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room request not found'
      });
    }
    
    // Get the room
    const room = await Room.findById(request.roomId);
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Check if room is full
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({
        status: 'fail',
        message: 'Room is now full, cannot assign tenant'
      });
    }
    
    // Create tenant object with _id field explicitly set
    // IMPORTANT FIX: Make sure userId exists and is set as _id
    const tenant = {
      _id: request.userId || `user_${Date.now()}`, // Use userId or generate a fallback
      name: request.name,
      email: request.email,
      phone: request.phone,
      photo: request.photo,
      moveInDate: request.moveInDate || new Date(),
      notes: request.notes
    };
    
    console.log("Adding tenant to room:", tenant);
    
    // Add tenant to room
    room.occupants.push(tenant);
    
    // Update room status
    if (room.occupants.length >= room.capacity) {
      room.status = 'full';
    } else {
      room.status = 'available';
    }
    
    await room.save();
    
    // Update request status
    request.status = 'approved';
    request.adminResponse = {
      adminId: req.body.adminId || 'admin',
      message: message || 'Your request has been approved',
      responseDate: new Date()
    };
    await request.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        request,
        room
      }
    });
  } catch (error) {
    console.error('Error approving room request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function to approve transfer requests
const approveTransferRequest = async (request, adminMessage) => {
  try {
    // Get the current and new rooms
    const [currentRoom, newRoom] = await Promise.all([
      Room.findById(request.currentRoomId),
      Room.findById(request.roomId)
    ]);
    
    if (!currentRoom || !newRoom) {
      return {
        success: false,
        status: 'fail',
        message: 'One of the rooms involved in the transfer could not be found'
      };
    }
    
    // Check if new room still has space
    if (newRoom.occupants.length >= newRoom.capacity) {
      request.status = 'rejected';
      request.adminResponse = {
        message: 'Transfer request cannot be completed because the requested room is now full',
        responseDate: new Date()
      };
      await request.save();
      
      return {
        success: false,
        status: 'fail',
        message: 'Requested room is now at full capacity. Transfer cannot be completed.'
      };
    }
    
    // Find the tenant in the current room
    const tenantIndex = currentRoom.occupants.findIndex(
      t => t.name === request.name || 
          (t.email && request.email && t.email === request.email)
    );
    
    if (tenantIndex === -1) {
      request.status = 'rejected';
      request.adminResponse = {
        message: 'Transfer request cannot be completed because tenant could not be found in the current room',
        responseDate: new Date()
      };
      await request.save();
      
      return {
        success: false,
        status: 'fail',
        message: 'Tenant could not be found in their current room. Transfer cannot be completed.'
      };
    }
    
    // Copy tenant data to transfer to the new room
    const tenant = { ...currentRoom.occupants[tenantIndex].toObject() };
    
    // Update the move-in date for the new room
    tenant.moveInDate = request.moveInDate;
    
    // Add a note about the transfer if none exists
    if (!tenant.notes) {
      tenant.notes = `Transferred from ${currentRoom.roomId || `Room ${currentRoom.roomNumber}`} on ${new Date().toLocaleDateString()}`;
    } else {
      tenant.notes += `\n\nTransferred from ${currentRoom.roomId || `Room ${currentRoom.roomNumber}`} on ${new Date().toLocaleDateString()}`;
    }
    
    // Remove tenant from current room
    currentRoom.occupants.splice(tenantIndex, 1);
    
    // Add tenant to new room
    newRoom.occupants.push(tenant);
    
    // Update status for both rooms
    if (currentRoom.occupants.length === 0) {
      currentRoom.status = 'vacant';
    } else if (currentRoom.occupants.length < currentRoom.capacity) {
      currentRoom.status = 'available';
    }
    
    if (newRoom.occupants.length >= newRoom.capacity) {
      newRoom.status = 'full';
    } else {
      newRoom.status = 'available';
    }
    
    // Update request status
    request.status = 'approved';
    request.adminResponse = {
      message: adminMessage || 'Your transfer request has been approved',
      responseDate: new Date()
    };
    
    // Save all changes
    await Promise.all([
      currentRoom.save(),
      newRoom.save(),
      request.save()
    ]);
    
    // Send email notification
    if (request.email) {
      try {
        await emailService.sendTransferApprovedEmail({
          email: request.email,
          name: request.name,
          oldRoom: currentRoom.roomId || `Room ${currentRoom.roomNumber}`,
          newRoom: newRoom.roomId || `Room ${newRoom.roomNumber}`,
          moveInDate: request.moveInDate,
          message: request.adminResponse.message
        });
      } catch (emailError) {
        console.error('Failed to send transfer approval email:', emailError);
      }
    }
    
    return {
      success: true,
      status: 'success',
      data: {
        request,
        currentRoom,
        newRoom
      }
    };
    
  } catch (error) {
    console.error('Error processing transfer request:', error);
    return {
      success: false,
      status: 'error',
      message: error.message
    };
  }
};

// Reject room request
exports.rejectRoomRequest = async (req, res) => {
  try {
    const request = await RoomRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room request not found'
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: `This request is already ${request.status}`
      });
    }
    
    // Update request status
    request.status = 'rejected';
    request.adminResponse = {
      message: req.body.message || 'Your room request has been rejected',
      responseDate: new Date()
    };
    
    await request.save();
    
    // Send email notification - customize for transfer requests
    if (request.email) {
      try {
        if (request.isTransferRequest) {
          const currentRoom = await Room.findById(request.currentRoomId);
          const requestedRoom = await Room.findById(request.roomId);
          
          await emailService.sendTransferRejectedEmail({
            email: request.email,
            name: request.name,
            currentRoom: currentRoom ? (currentRoom.roomId || `Room ${currentRoom.roomNumber}`) : 'your current room',
            requestedRoom: requestedRoom ? (requestedRoom.roomId || `Room ${requestedRoom.roomNumber}`) : 'the requested room',
            message: request.adminResponse.message
          });
        } else {
          // Original email logic for regular room requests
          await emailService.sendRoomRequestRejectedEmail({
            email: request.email,
            name: request.name,
            roomId: request.roomId,
            message: request.adminResponse.message
          });
        }
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error rejecting room request:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get room requests by user
exports.getUserRoomRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const requests = await RoomRequest.find({ userId })
      .populate('roomId', 'roomNumber roomId property status')
      .sort({ requestDate: -1 });
    
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    console.error('Error getting user room requests:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete room request
exports.deleteRoomRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the request first to check its status
    const request = await RoomRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room request not found'
      });
    }
    
    // Only allow deletion of non-pending requests
    if (request.status === 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'Pending requests cannot be deleted. They must be approved or rejected first.'
      });
    }
    
    // Delete the request
    await RoomRequest.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Room request deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting room request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting room request'
    });
  }
};

// Add this function to handle transfer requests specifically

// Get transfer requests
exports.getTransferRequests = async (req, res) => {
  try {
    // Build filter for transfer requests
    let filter = { 
      $or: [
        { isTransferRequest: true },
        { requestType: 'transfer' }
      ]
    };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Get transfer requests with filters
    const requests = await RoomRequest.find(filter)
      .populate('roomId', 'roomNumber roomId property status')
      .populate('currentRoomId', 'roomNumber roomId property status')
      .sort({ requestDate: -1 });
    
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    console.error('Error getting transfer requests:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add this helper function at the bottom of the file
const completeOldMoveOutRequests = async (userId) => {
  try {
    // Find all approved move-out requests for this user and mark them as completed
    await MoveOutRequest.updateMany(
      { 
        userId,
        status: 'approved' 
      },
      {
        $set: {
          status: 'completed',
          adminResponse: {
            message: 'Automatically marked as completed when tenant moved to a new room',
            responseDate: new Date()
          }
        }
      }
    );
  } catch (error) {
    console.error('Error completing old move-out requests:', error);
  }
};