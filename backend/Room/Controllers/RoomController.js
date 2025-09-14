const Room = require('../Models/RoomModel');
const Property = require('../Models/PropertyModel');
const RoomRequest = require('../Models/RoomRequestModel');
const MoveOutRequest = require('../Models/MoveOutRequestModel');
const mongoose = require('mongoose');
const emailService = require('../../Services/EmailService');

// Get all rooms (with filtering)
exports.getAllRooms = async (req, res) => {
  try {
    // Build filter object
    let filter = {};
    
    if (req.query.property) {
      filter.property = req.query.property;
    }
    
    // Handle multiple status values (comma-separated)
    if (req.query.status) {
      const statuses = req.query.status.split(',');
      filter.status = { $in: statuses };
    }
    
    if (req.query.capacity) {
      filter.capacity = { $gte: parseInt(req.query.capacity) };
    }
    
    // Get rooms with filters
    const rooms = await Room.find(filter).populate('property', 'name address');
    
    // Format the rooms to include all needed data for the frontend
    const formattedRooms = rooms.map(room => {
      const roomObj = room.toObject();
      
      // Add property name and address if available
      if (roomObj.property) {
        roomObj.propertyName = roomObj.property.name;
        roomObj.propertyAddress = roomObj.property.address ? 
          `${roomObj.property.address.city}, ${roomObj.property.address.state || ''}` : 
          '';
      }
      
      return roomObj;
    });
    
    res.status(200).json({
      status: 'success',
      results: formattedRooms.length,
      data: {
        rooms: formattedRooms
      }
    });
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get room by ID
exports.getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid room ID format'
      });
    }
    
    const room = await Room.findById(id)
      .populate('property', 'name address contactInfo')
      .populate('occupants');
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    console.error('Error getting room details:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve room details'
    });
  }
};

// Create new room
exports.createRoom = async (req, res) => {
  try {
    // Check if the property exists
    const property = await Property.findById(req.body.property);
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found'
      });
    }
    
    // Check if roomId is already in use
    if (req.body.roomId) {
      const existingRoom = await Room.findOne({ roomId: req.body.roomId });
      if (existingRoom) {
        return res.status(400).json({
          status: 'fail',
          message: 'Room ID is already in use'
        });
      }
    }
    
    const newRoom = await Room.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        room: newRoom
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update room
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Check if room has occupants
    if (room.occupants && room.occupants.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot delete room with occupants. Please remove occupants first.'
      });
    }
    
    await Room.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Allocate tenant to room
exports.allocateRoom = async (req, res) => {
  try {
    const { roomId, tenantId } = req.body;
    
    if (!roomId || !tenantId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Room ID and Tenant ID are required'
      });
    }
    
    // Find the room
    const room = await Room.findById(roomId);
    
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
        message: 'Room is already at full capacity'
      });
    }
    
    // Check if tenant is already in this room
    if (room.occupants.includes(tenantId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tenant is already assigned to this room'
      });
    }
    
    // Add tenant to room
    room.occupants.push(tenantId);
    
    // Update status based on capacity
    if (room.occupants.length >= room.capacity) {
      room.status = 'full';
    } else {
      room.status = 'available';
    }
    
    await room.save();
    
    // Add this code to auto-complete old move-out requests
    try {
      // Find any approved move-out requests for this tenant and mark them completed
      await MoveOutRequest.updateMany(
        { 
          userId: req.body.tenantId || tenantId,
          status: { $in: ['approved', 'pending'] }
        },
        {
          $set: {
            status: 'completed',
            adminResponse: {
              adminId: 'system',
              message: 'Automatically marked as completed when tenant was assigned to a new room',
              responseDate: new Date()
            }
          }
        }
      );
    } catch (cleanupError) {
      console.error('Error cleaning up old move-out requests:', cleanupError);
      // Don't fail the main operation if this cleanup fails
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add tenant to room
exports.addTenant = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const newTenant = req.body;
    
    // Find room and populate property details
    const room = await Room.findById(roomId).populate('property', 'name');
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Check if room is at capacity
    if (room.occupants && room.occupants.length >= room.capacity) {
      return res.status(400).json({
        status: 'fail',
        message: 'Room is already at full capacity'
      });
    }
    
    // Add tenant to room's occupants
    if (!room.occupants) {
      room.occupants = [];
    }
    
    room.occupants.push(newTenant);
    // Update room status based on current occupancy
    updateRoomStatus(room);
    await room.save();
    
    // Send email confirmation if tenant has an email
    if (newTenant.email) {
      try {
        await emailService.sendRoomAllocationEmail({
          email: newTenant.email,
          name: newTenant.name,
          roomId: room.roomId || `Room ${room.roomNumber}`,
          propertyName: room.property?.name || 'Our Boarding House',
          moveInDate: newTenant.moveInDate || new Date()
        });
        
        console.log(`Allocation confirmation email sent to ${newTenant.email}`);
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('Failed to send confirmation email:', emailError);
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    console.error('Error adding tenant:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Remove tenant from room
exports.removeTenant = async (req, res) => {
  try {
    const { id: roomId, tenantId } = req.params;
    
    // Find room and remove tenant
    const room = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { occupants: { _id: tenantId } } },
      { new: true }
    );
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Update room status based on current occupancy
    updateRoomStatus(room);
    await room.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    console.error('Error removing tenant:', error);
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update tenant in room
exports.updateTenant = async (req, res) => {
  try {
    const { id: roomId, tenantId } = req.params;
    const updates = req.body;
    
    // Find room
    const room = await Room.findById(roomId).populate('property', 'name');
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Find tenant in room
    const tenant = room.occupants.id(tenantId);
    
    if (!tenant) {
      return res.status(404).json({
        status: 'fail',
        message: 'Tenant not found in this room'
      });
    }
    
    // Check if moveInDate has changed and it's not in the past
    const moveInDateChanged = 
      updates.moveInDate && 
      (!tenant.moveInDate || 
        new Date(updates.moveInDate).toDateString() !== new Date(tenant.moveInDate).toDateString()) &&
      new Date(updates.moveInDate) > new Date();
    
    // Update tenant fields
    Object.keys(updates).forEach(key => {
      tenant[key] = updates[key];
    });
    
    await room.save();
    
    // Send email notification if moveInDate changed and tenant has email
    if (moveInDateChanged && tenant.email) {
      try {
        await emailService.sendRoomAllocationEmail({
          email: tenant.email,
          name: tenant.name,
          roomId: room.roomId || `Room ${room.roomNumber}`,
          propertyName: room.property?.name || 'Our Boarding House',
          moveInDate: tenant.moveInDate
        });
        
        console.log(`Updated allocation details email sent to ${tenant.email}`);
      } catch (emailError) {
        // Log error but don't fail the request
        console.error('Failed to send update email:', emailError);
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        room
      }
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(400),
    json({
      status: 'fail',
      message: error.message
    });
  }
};

// Get all tenants (unassigned tenants not applicable with this approach)
exports.getAllTenants = async (req, res) => {
  try {
    // Find all rooms with tenants
    const rooms = await Room.find({ 'occupants.0': { $exists: true } });
    
    // Extract all tenants from all rooms
    const tenants = rooms.flatMap(room => 
      room.occupants.map(tenant => ({
        ...tenant.toObject(),
        roomId: room._id,
        roomNumber: room.roomNumber
      }))
    );
    
    res.status(200).json({
      status: 'success',
      results: tenants.length,
      data: {
        tenants
      }
    });
  } catch (error) {
    console.error('Error getting tenants:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create transfer request
exports.createTransferRequest = async (req, res) => {
  try {
    const { 
      userId, 
      currentRoomId, 
      newRoomId, 
      name, 
      email, 
      phone, 
      photo,
      reason, 
      notes, 
      moveInDate 
    } = req.body;
    
    // Basic validation
    if (!userId || !currentRoomId || !newRoomId || !name || !reason) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields'
      });
    }
    
    // Create the transfer request
    const transferRequest = await RoomRequest.create({
      userId,
      roomId: newRoomId, // The room they want to transfer to
      currentRoomId,     // The room they're currently in
      name,
      email,
      phone,
      photo,
      reason,
      notes,
      moveInDate: moveInDate || new Date(),
      isTransferRequest: true,
      requestType: 'transfer',
      status: 'pending',
      requestDate: new Date()
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        request: transferRequest
      }
    });
    
  } catch (error) {
    console.error('Error creating transfer request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating transfer request'
    });
  }
};

// Update transfer request status
exports.updateTransferRequest = async (req, res) => {
  try {
    const { requestId, status, message } = req.body;
    
    if (!requestId || !status || !['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Request ID and valid status (approved/rejected/cancelled) are required'
      });
    }
    
    // Find the transfer request
    const transferRequest = await RoomRequest.findById(requestId);
    
    if (!transferRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transfer request not found'
      });
    }
    
    // Update the request with admin response
    transferRequest.status = status;
    transferRequest.adminResponse = {
      message: message || `Your room transfer request has been ${status}`,
      responseDate: new Date()
    };
    
    // If approved, handle the actual transfer
    if (status === 'approved') {
      // Get the rooms involved
      const [currentRoom, newRoom] = await Promise.all([
        Room.findById(transferRequest.currentRoomId),
        Room.findById(transferRequest.roomId)
      ]);
      
      if (!currentRoom || !newRoom) {
        return res.status(404).json({
          status: 'fail',
          message: 'One of the rooms involved in the transfer could not be found'
        });
      }
      
      // Check if new room has space
      if (newRoom.occupants && newRoom.occupants.length >= newRoom.capacity) {
        transferRequest.status = 'rejected';
        transferRequest.adminResponse = {
          message: 'Transfer request cannot be completed because the requested room is now full',
          responseDate: new Date()
        };
        await transferRequest.save();
        
        return res.status(400).json({
          status: 'fail',
          message: 'Requested room is now at full capacity. Transfer cannot be completed.'
        });
      }
      
      // Find the tenant in the current room
      const tenantIndex = currentRoom.occupants.findIndex(
        t => t.name === transferRequest.name || 
            (t.email && transferRequest.email && t.email === transferRequest.email)
      );
      
      if (tenantIndex === -1) {
        transferRequest.status = 'rejected';
        transferRequest.adminResponse = {
          message: 'Transfer request cannot be completed because tenant could not be found in the current room',
          responseDate: new Date()
        };
        await transferRequest.save();
        
        return res.status(400).json({
          status: 'fail',
          message: 'Tenant could not be found in their current room. Transfer cannot be completed.'
        });
      }
      
      // Copy tenant data to transfer to the new room
      const tenant = { ...currentRoom.occupants[tenantIndex].toObject() };
      
      // Update the move-in date for the new room
      tenant.moveInDate = transferRequest.moveInDate;
      
      // Add a note about the transfer
      if (!tenant.notes) {
        tenant.notes = `Transferred from ${currentRoom.roomId || `Room ${currentRoom.roomNumber}`} on ${new Date().toLocaleDateString()}`;
      } else {
        tenant.notes += `\n\nTransferred from ${currentRoom.roomId || `Room ${currentRoom.roomNumber}`} on ${new Date().toLocaleDateString()}`;
      }
      
      // Remove tenant from current room
      currentRoom.occupants.splice(tenantIndex, 1);
      
      // Add tenant to new room
      if (!newRoom.occupants) {
        newRoom.occupants = [];
      }
      newRoom.occupants.push(tenant);
      
      // Update room statuses
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
      
      // Save both rooms
      await Promise.all([currentRoom.save(), newRoom.save()]);
      
      // Send email notification if email service is available
      if (transferRequest.email && typeof emailService?.sendTransferApprovalEmail === 'function') {
        try {
          await emailService.sendTransferApprovalEmail({
            email: transferRequest.email,
            name: transferRequest.name,
            oldRoom: currentRoom.roomId || `Room ${currentRoom.roomNumber}`,
            newRoom: newRoom.roomId || `Room ${newRoom.roomNumber}`,
            moveInDate: transferRequest.moveInDate,
            message: transferRequest.adminResponse.message
          });
        } catch (emailError) {
          console.error('Failed to send transfer approval email:', emailError);
        }
      }
    }
    
    // Save the updated request
    await transferRequest.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        request: transferRequest
      }
    });
    
  } catch (error) {
    console.error('Error updating transfer request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating transfer request'
    });
  }
};

// Get all transfer requests
exports.getTransferRequests = async (req, res) => {
  try {
    console.log('Getting transfer requests...');
    
    // Build filter for transfer requests
    const filter = { 
      $or: [
        { isTransferRequest: true },
        { requestType: 'transfer' }
      ]
    };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Get all room requests that are transfer requests
    const requests = await RoomRequest.find(filter)
      .populate({
        path: 'roomId',
        select: 'roomNumber roomId property status',
        populate: {
          path: 'property',
          select: 'name address'
        }
      })
      .populate({
        path: 'currentRoomId',
        select: 'roomNumber roomId property status',
        populate: {
          path: 'property',
          select: 'name address'
        }
      })
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
      message: error.message || 'Error fetching transfer requests'
    });
  }
};

// Get user's current room (for My Room page)
exports.getUserRoom = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID is required'
      });
    }
    
    console.log(`Finding room for user ID: ${userId}`);
    
    // Use a string comparison approach instead of ObjectId matching
    const rooms = await Room.find({}).populate('property', 'name address');
    
    // Filter rooms manually to find the one with matching occupant id
    const room = rooms.find(room => 
      room.occupants && room.occupants.some(occupant => 
        occupant._id === userId
      )
    );
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'No room found for this user'
      });
    }
    
    // Find tenant info for this specific user
    const tenant = room.occupants.find(o => o._id === userId);
    
    console.log(`Found room ${room.roomId || room.roomNumber} for user ${userId}`);
    
    res.status(200).json({
      status: 'success',
      data: {
        room,
        tenant
      }
    });
  } catch (error) {
    console.error('Error getting user room:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update room status based on occupancy
const updateRoomStatus = (room) => {
  if (!room.occupants || room.occupants.length === 0) {
    room.status = 'vacant';
  } else if (room.occupants.length >= room.capacity) {
    room.status = 'full';
  } else if (room.occupants.length > 0) {
    room.status = 'available';
  } else {
    room.status = 'vacant';
  }
  return room;
};

// Request to move out
exports.requestMoveOut = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { tenantId, reason, moveOutDate } = req.body;
    
    // Find room
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Find tenant in the room
    const tenantIndex = room.occupants.findIndex(
      tenant => tenant.name === 'Chamithu Sithmaka' || 
                tenant.email === 'chamith@example.com'
    );
    
    if (tenantIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Tenant not found in this room'
      });
    }
    
    // Get tenant info for creating the move-out request
    const tenant = room.occupants[tenantIndex];
    
    // Check if there's already a pending move-out request for THIS specific room
    const existingRequest = await MoveOutRequest.findOne({
      userId: req.body.userId || 'user456',
      roomId: room._id,
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have a pending move-out request for this room'
      });
    }
    
    // Before creating a new request, check and complete any previous ones
    try {
      // Auto-complete any previous approved move-out requests
      await MoveOutRequest.updateMany(
        { 
          userId: req.body.userId || 'user456',
          status: 'approved',
          roomId: { $ne: room._id } // Don't complete requests for the current room
        },
        {
          $set: {
            status: 'completed',
            adminResponse: {
              adminId: 'system',
              message: 'Automatically completed when requesting move-out from a new room',
              responseDate: new Date()
            }
          }
        }
      );
    } catch (cleanupError) {
      console.error('Error auto-completing previous move-out requests:', cleanupError);
      // Continue with the request even if cleanup fails
    }

    // Create a move-out request using MoveOutRequest model instead of RoomRequest
    const moveOutRequest = await MoveOutRequest.create({
      userId: req.body.userId || 'user456', // For demo user
      roomId: room._id,
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phone,
      tenantPhoto: tenant.photo,
      reason: reason,
      moveOutDate: moveOutDate,
      status: 'pending',
      requestDate: new Date(),
      notes: req.body.notes || ''
    });
    
    // Send confirmation email
    if (tenant.email) {
      try {
        await emailService.sendMoveOutConfirmation({
          email: tenant.email,
          name: tenant.name,
          roomId: room.roomId || `Room ${room.roomNumber}`,
          moveOutDate: moveOutDate,
          reason: reason
        });
      } catch (emailError) {
        console.error('Failed to send move-out confirmation email:', emailError);
      }
    }
    
    res.status(201).json({
      status: 'success',
      message: 'Move-out request submitted successfully',
      data: {
        request: moveOutRequest
      }
    });
  } catch (error) {
    console.error('Error processing move-out request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all move-out requests
exports.getMoveOutRequests = async (req, res) => {
  try {
    console.log('Getting move-out requests...');
    
    // Clean up old completed move-out requests that are more than 30 days old
    if (req.query.cleanup !== 'false') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      try {
        const deleteResult = await MoveOutRequest.deleteMany({
          status: 'completed',
          'adminResponse.responseDate': { $lt: thirtyDaysAgo }
        });
        
        if (deleteResult.deletedCount > 0) {
          console.log(`Auto-cleaned ${deleteResult.deletedCount} old completed move-out requests`);
        }
      } catch (cleanupError) {
        console.error('Error during auto-cleanup of old move-out requests:', cleanupError);
      }
    }
    
    // Get all move-out requests
    const moveOutRequests = await MoveOutRequest.find()
      .populate({
        path: 'roomId',
        select: 'roomNumber roomId property status',
        populate: {
          path: 'property',
          select: 'name address'
        }
      })
      .sort({ requestDate: -1 });
    
    // Format the response for the frontend
    const requests = moveOutRequests.map(request => ({
      _id: request._id,
      tenantName: request.tenantName,
      tenantEmail: request.tenantEmail,
      tenantPhone: request.tenantPhone,
      tenantPhoto: request.tenantPhoto,
      room: {
        _id: request.roomId?._id,
        roomId: request.roomId?.roomId,
        roomNumber: request.roomId?.roomNumber,
        property: {
          name: request.roomId?.property?.name,
          address: request.roomId?.property?.address
        }
      },
      reason: request.reason,
      requestDate: request.requestDate,
      moveOutDate: request.moveOutDate,
      status: request.status,
      adminResponse: request.adminResponse,
      notes: request.notes
    }));
    
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    console.error('Error getting move-out requests:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching move-out requests'
    });
  }
};

// Get move-out request by ID
exports.getMoveOutRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await MoveOutRequest.findById(id)
      .populate({
        path: 'roomId',
        select: 'roomNumber roomId property status images price',
        populate: {
          path: 'property',
          select: 'name address'
        }
      });
    
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Move-out request not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error getting move-out request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error fetching move-out request'
    });
  }
};

// Update move-out request
exports.updateMoveOutRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminMessage } = req.body;
    
    if (!status || !['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Valid status (approved/rejected/completed) is required'
      });
    }
    
    const request = await MoveOutRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Move-out request not found'
      });
    }
    
    console.log(`Processing move-out request ${id} with status: ${status}`);
    
    // Update request status
    request.status = status;
    request.adminResponse = {
      message: adminMessage || `Your move-out request has been ${status}`,
      responseDate: new Date()
    };
    
    // If approved or completed, remove tenant from room
    if (status === 'approved' || status === 'completed') {
      const room = await Room.findById(request.roomId);
      
      if (room) {
        console.log(`Found room: ${room.roomId || room.roomNumber}`);
        console.log(`Before: Occupants count: ${room.occupants.length}`);
        
        // Find the tenant in the room using the request data
        const tenantIndex = room.occupants.findIndex(tenant => 
          // Use multiple criteria to ensure we find the right tenant
          (tenant.name === request.tenantName) || 
          (tenant.email && request.tenantEmail && tenant.email === request.tenantEmail) ||
          (tenant._id && tenant._id.toString() === request.tenantId)
        );
        
        console.log(`Tenant index in room: ${tenantIndex}`);
        
        if (tenantIndex !== -1) {
          // Get tenant info before removing
          const removedTenant = room.occupants[tenantIndex];
          console.log(`Removing tenant: ${removedTenant.name}`);
          
          // Remove tenant from room
          room.occupants.splice(tenantIndex, 1);
          
          // Update room status
          updateRoomStatus(room);
          
          await room.save();
          console.log(`After: Occupants count: ${room.occupants.length}`);
          console.log(`Room status updated to: ${room.status}`);
          
          // Send email notification to tenant
          if (request.tenantEmail) {
            try {
              await emailService.sendMoveOutApprovalEmail({
                email: request.tenantEmail,
                name: request.tenantName,
                roomId: room.roomId || `Room ${room.roomNumber}`,
                moveOutDate: request.moveOutDate,
                message: request.adminResponse.message
              });
            } catch (emailErr) {
              console.error('Failed to send move-out approval email:', emailErr);
            }
          }
        } else {
          console.log(`Tenant ${request.tenantName} not found in room occupants`);
        }
      } else {
        console.log(`Room with ID ${request.roomId} not found`);
      }
    }
    
    await request.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error updating move-out request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating move-out request'
    });
  }
};

// Create move-out request
exports.createMoveOutRequest = async (req, res) => {
  try {
    const { 
      userId, 
      roomId,
      tenantName,
      tenantEmail,
      tenantPhone,
      tenantPhoto,
      reason, 
      moveOutDate,
      notes
    } = req.body;
    
    // Basic validation
    if (!userId || !roomId || !tenantName || !reason || !moveOutDate) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields'
      });
    }
    
    // Create the move-out request
    const moveOutRequest = await MoveOutRequest.create({
      userId,
      roomId,
      tenantName,
      tenantEmail,
      tenantPhone,
      tenantPhoto,
      reason,
      moveOutDate,
      notes,
      status: 'pending',
      requestDate: new Date()
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        request: moveOutRequest
      }
    });
    
  } catch (error) {
    console.error('Error creating move-out request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating move-out request'
    });
  }
};

// Delete all transfer requests
exports.deleteAllTransferRequests = async (req, res) => {
  try {
    // Build filter for transfer requests
    const filter = { 
      $or: [
        { isTransferRequest: true },
        { requestType: 'transfer' }
      ]
    };
    
    // Delete all transfer requests that match the filter
    const result = await RoomRequest.deleteMany(filter);
    
    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} transfer requests have been deleted`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting all transfer requests:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting transfer requests'
    });
  }
};

// Delete a move-out request
exports.deleteMoveOutRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the request first
    const request = await MoveOutRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        status: 'fail',
        message: 'Move-out request not found'
      });
    }
    
    // Only allow deletion of approved or rejected requests
    if (request.status !== 'approved' && request.status !== 'rejected') {
      return res.status(400).json({
        status: 'fail',
        message: 'Only approved or rejected requests can be deleted'
      });
    }
    
    // Delete the request
    await MoveOutRequest.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Move-out request deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting move-out request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting move-out request'
    });
  }
};

// Delete a single transfer request
exports.deleteTransferRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the transfer request first
    const transferRequest = await RoomRequest.findById(id);
    
    if (!transferRequest) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transfer request not found'
      });
    }
    
    // Only allow deletion of non-pending requests
    if (transferRequest.status === 'pending') {
      return res.status(400).json({
        status: 'fail',
        message: 'Pending requests cannot be deleted. They must be approved or rejected first.'
      });
    }
    
    // Delete the request
    await RoomRequest.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Transfer request deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting transfer request:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting transfer request'
    });
  }
};

// Check consistency of move-out requests
exports.checkMoveOutRequestConsistency = async (req, res) => {
  try {
    // Find all move-out requests
    const moveOutRequests = await MoveOutRequest.find();
    
    let fixedCount = 0;
    const issues = [];
    
    for (const request of moveOutRequests) {
      // Skip requests that are already completed
      if (request.status === 'completed') continue;
      
      // Check if the tenant is still in the room
      const room = await Room.findById(request.roomId);
      if (!room) {
        // Room doesn't exist anymore, mark as completed
        request.status = 'completed';
        request.adminResponse = {
          message: 'Automatically marked as completed because the room no longer exists',
          responseDate: new Date()
        };
        await request.save();
        fixedCount++;
        issues.push(`Request ${request._id} marked as completed because room no longer exists`);
        continue;
      }
      
      // Check if tenant is still in the room
      const tenantStillInRoom = room.occupants.some(tenant => 
        tenant.name === request.tenantName || 
        (tenant.email && request.tenantEmail && tenant.email === request.tenantEmail)
      );
      
      if (request.status === 'approved' && !tenantStillInRoom) {
        // Tenant is no longer in the room, but request is still approved (not completed)
        request.status = 'completed';
        request.adminResponse = {
          ...request.adminResponse,
          message: (request.adminResponse?.message || '') + ' (Automatically marked as completed because tenant is no longer in the room)',
          responseDate: new Date()
        };
        await request.save();
        fixedCount++;
        issues.push(`Request ${request._id} marked as completed because tenant ${request.tenantName} is no longer in room ${room.roomNumber || room._id}`);
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: `Checked ${moveOutRequests.length} move-out requests and fixed ${fixedCount} inconsistencies`,
      data: {
        totalRequests: moveOutRequests.length,
        fixedCount,
        issues
      }
    });
  } catch (error) {
    console.error('Error checking move-out request consistency:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error checking move-out request consistency'
    });
  }
};

// Add this new function to get transfer requests for a specific user
exports.getUserTransferRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID is required'
      });
    }
    
    // Find pending transfer requests for this user
    const requests = await RoomRequest.find({
      userId,
      isTransferRequest: true,
      status: 'pending'
    }).populate('roomId').populate('currentRoomId');
    
    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    console.error('Error getting user transfer requests:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve transfer requests'
    });
  }
};