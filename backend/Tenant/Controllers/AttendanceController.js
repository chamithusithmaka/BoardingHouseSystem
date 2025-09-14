const Attendance = require('../Models/AttendanceModel');
const Room = require('../../Room/Models/RoomModel');
const UtilitySettings = require('../../Room/Models/UtilitySettingsModel');
const EmailService = require('../../Services/EmailService');

// Helper function to get today's date at midnight
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Helper function to get utility settings for a room
const getUtilitySettings = async (roomId) => {
  try {
    // Get room to find its property
    const room = await Room.findById(roomId).populate('property');
    
    if (!room) {
      return {
        allowedDailyHours: 10,  // Default values
        extraHourlyRate: 20
      };
    }
    
    const propertyId = room.property?._id || room.property;
    
    // If no property found, return default settings
    if (!propertyId) {
      return {
        allowedDailyHours: 10,
        extraHourlyRate: 20
      };
    }
    
    // Try to find settings for this property
    const settings = await UtilitySettings.findOne({ propertyId });
    
    // Return settings or defaults
    return settings || {
      allowedDailyHours: 10,
      extraHourlyRate: 20
    };
  } catch (error) {
    console.error('Error getting utility settings:', error);
    return {
      allowedDailyHours: 10,
      extraHourlyRate: 20
    };
  }
};


// Add this function to your AttendanceController.js
exports.createAttendanceRecord = async (req, res) => {
  try {
    const {
      tenantId,
      roomId,
      date,
      checkInTime,
      checkOutTime,
      duration,
      status,
      exceededHours,
      extraCharge,
      notes
    } = req.body;
    
    // Validate required fields
    if (!tenantId || !roomId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tenant ID and Room ID are required'
      });
    }
    
    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Create attendance record with custom exceeded hours
    const recordDate = date ? new Date(date) : new Date();
    const attendance = await Attendance.create({
      tenantId,
      roomId,
      date: recordDate,
      checkInTime: checkInTime ? new Date(checkInTime) : recordDate,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      duration: duration || 0,
      status: status || 'exceeded-limit',
      exceededHours: exceededHours || 0,
      notificationSent: extraCharge ? true : false,
      notes: notes || `Manually created record with ${exceededHours} exceeded hours and ₱${extraCharge} extra charge`
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Attendance record created successfully',
      data: {
        attendance,
        extraCharge
      }
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get today's attendance for a tenant
exports.getTodayAttendance = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tenant ID is required'
      });
    }
    
    // Get today's attendance record
    const today = getTodayDate();
    
    const attendance = await Attendance.findOne({
      tenantId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('roomId', 'roomNumber roomId');
    
    res.status(200).json({
      status: 'success',
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Error in getTodayAttendance:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Check in a tenant
exports.checkIn = async (req, res) => {
  try {
    const { tenantId, roomId } = req.body;
    
    if (!tenantId || !roomId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tenant ID and Room ID are required'
      });
    }
    
    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        status: 'fail',
        message: 'Room not found'
      });
    }
    
    // Check if tenant already checked in today
    const today = getTodayDate();
    
    const existingAttendance = await Attendance.findOne({
      tenantId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already checked in today',
        data: {
          attendance: existingAttendance
        }
      });
    }
    
    // Create new attendance record
    const checkInTime = new Date();
    const attendance = await Attendance.create({
      tenantId,
      roomId,
      date: checkInTime,
      checkInTime,
      status: 'checked-in'
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Check-in successful',
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Check out a tenant
exports.checkOut = async (req, res) => {
  try {
    const { tenantId } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tenant ID is required'
      });
    }
    
    // Find today's attendance record
    const today = getTodayDate();
    
    const attendance = await Attendance.findOne({
      tenantId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'checked-in'
    }).populate('roomId');
    
    if (!attendance) {
      return res.status(404).json({
        status: 'fail',
        message: 'No active check-in found for today'
      });
    }
    
    // Update with check-out time
    const checkOutTime = new Date();
    const durationMinutes = Math.round((checkOutTime - attendance.checkInTime) / (1000 * 60));
    
    // Get utility settings for this room
    const settings = await getUtilitySettings(attendance.roomId);
    
    // Check if duration exceeds allowed hours
    const allowedMinutes = settings.allowedDailyHours * 60;
    let status = 'checked-out';
    let exceededHours = 0;
    
    if (durationMinutes > allowedMinutes) {
      status = 'exceeded-limit';
      exceededHours = Math.ceil((durationMinutes - allowedMinutes) / 60);
      
      // In a real implementation, send notifications here
      console.log(`User ${tenantId} has exceeded utility hours by ${exceededHours} hours`);
    }
    
    // Update attendance record
    attendance.checkOutTime = checkOutTime;
    attendance.duration = durationMinutes;
    attendance.status = status;
    attendance.exceededHours = exceededHours;
    attendance.notificationSent = (exceededHours > 0);
    await attendance.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Check-out successful',
      data: {
        attendance,
        exceededHours,
        extraCharge: exceededHours * settings.extraHourlyRate
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get attendance history for a tenant
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Tenant ID is required'
      });
    }
    
    // Build query
    const query = { tenantId };
    
    // Add date range if provided
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        query.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
      }
    }
    
    const attendance = await Attendance.find(query)
      .populate('roomId', 'roomNumber roomId')
      .sort({ date: -1 });
    
    res.status(200).json({
      status: 'success',
      results: attendance.length,
      data: {
        attendance
      }
    });
  } catch (error) {
    console.error('Error getting attendance history:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update the markAbsentTenants function
exports.markAbsentTenants = async (testMode = false, specificTenantId = null) => {
  try {
    // Check for absences in the previous 24 hours
    const checkDate = new Date();
    
    if (testMode) {
      checkDate.setMinutes(checkDate.getMinutes() - 1);
      console.log(`TEST MODE: Marking absences for the last minute (since ${checkDate.toISOString()})`);
    } else {
      checkDate.setHours(checkDate.getHours() - 24);
      console.log(`Marking absences for tenants who haven't checked in during the past 24 hours (since ${checkDate.toISOString()})`);
    }
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let markedCount = 0;
    
    // If specificTenantId is provided, only mark that tenant
    if (specificTenantId) {
      console.log(`Testing absent marking for specific tenant: ${specificTenantId}`);
      
      // First check if tenant already has an attendance record for today
      const hasAttendanceToday = await Attendance.exists({
        tenantId: specificTenantId,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (hasAttendanceToday) {
        console.log(`Tenant ${specificTenantId} already has attendance record for today, skipping`);
        return 0;
      }
      
      // Get the room for this tenant
      const room = await Room.findOne({
        'occupants': { 
          $elemMatch: { 
            '_id': { $eq: specificTenantId } 
          } 
        }
      });
      
      if (!room) {
        console.log(`No room found for tenant ${specificTenantId}`);
        return 0;
      }
      
      // Create absent record for this specific tenant
      await Attendance.create({
        tenantId: specificTenantId,
        roomId: room._id,
        date: new Date(),
        checkInTime: new Date(),
        status: 'absent',
        duration: 0,
        notes: testMode ? 'Marked absent by test function' : 'No check-in within past 24 hours (tenant test)'
      });
      
      console.log(`Marked tenant ${specificTenantId} as absent`);
      return 1;
    }
    
    // Original code for marking all tenants
    // Get all rooms with tenants
    const rooms = await Room.find({
      'occupants.0': { $exists: true }
    }).populate('occupants');
    
    console.log(`Found ${rooms.length} rooms with occupants`);
    markedCount = 0;
    
    // For each room, get the tenants and check their attendance
    for (const room of rooms) {
      for (const occupant of room.occupants) {
        // Convert ObjectId to string if it's an ObjectId
        const tenantId = typeof occupant._id === 'object' ? 
          occupant._id.toString() : occupant._id;
          
        console.log(`Checking attendance for tenant: ${tenantId} in room: ${room.roomNumber || room._id}`);
        
        // First check if tenant already has an attendance record for today
        // If they do, we don't need to mark them absent
        const hasAttendanceToday = await Attendance.exists({
          tenantId,
          date: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        });
        
        if (hasAttendanceToday) {
          console.log(`Tenant ${tenantId} already has attendance record for today, skipping`);
          continue;
        }
        
        // Check if tenant has checked in during the past 24 hours
        // If not, mark them as absent
        const hasRecentCheckIn = await Attendance.exists({
          tenantId,
          checkInTime: { $gte: checkDate },
          status: 'checked-in'
        });
        
        if (!hasRecentCheckIn) {
          console.log(`No check-in found in last 24 hours for tenant: ${tenantId}, marking as absent`);
          
          // Create absent record
          await Attendance.create({
            tenantId,
            roomId: room._id,
            date: new Date(),
            checkInTime: new Date(),
            status: 'absent',
            duration: 0,
            notes: testMode ? 'Marked absent by test function' : 'No check-in within past 24 hours'
          });
          
          markedCount++;
        } else {
          console.log(`Tenant ${tenantId} has checked in within the last 24 hours, not marking absent`);
        }
      }
    }
    
    console.log(`Marked ${markedCount} tenants as absent`);
    return markedCount;
  } catch (error) {
    console.error('Error marking absent tenants:', error);
    throw error;
  }
};

// Get attendance summary for all tenants
exports.getAttendanceSummary = async (req, res) => {
  try {
    // Default to last 7 days if no range provided
    const currentDate = new Date();
    // Change const to let for these variables
    let endDate = new Date(currentDate);
    let startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - 7);
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59);
    }
    
    // Return empty array when no records exist
    // This prevents errors when trying to access database records
    const recordCount = await Attendance.countDocuments();
    if (recordCount === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          startDate,
          endDate,
          summary: []
        }
      });
    }
    
    // Get attendance records in date range
    let records = [];
    try {
      records = await Attendance.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('roomId', 'roomNumber roomId property')
      .sort({ date: -1 });
    } catch (queryError) {
      console.error('Error querying attendance records:', queryError);
      // Continue with empty records array if query fails
      // This prevents the entire function from failing
    }
    
    // Group by tenant
    const tenantSummary = {};
    
    for (const record of records) {
      // Skip invalid records
      if (!record || !record.tenantId) continue;
      
      const tenantId = record.tenantId.toString();
      
      if (!tenantSummary[tenantId]) {
        tenantSummary[tenantId] = {
          tenantId,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          exceededDays: 0,
          totalHours: 0,
          totalExceededHours: 0
        };
      }
      
      // Update summary
      tenantSummary[tenantId].totalDays++;
      
      if (record.status === 'absent') {
        tenantSummary[tenantId].absentDays++;
      } else {
        tenantSummary[tenantId].presentDays++;
        
        // Calculate hours with safety checks
        const duration = record.duration || 0;
        tenantSummary[tenantId].totalHours += duration / 60;
        
        if (record.exceededHours > 0) {
          tenantSummary[tenantId].exceededDays++;
          tenantSummary[tenantId].totalExceededHours += record.exceededHours;
        }
      }
    }
    
    // Return summary
    res.status(200).json({
      status: 'success',
      data: {
        startDate,
        endDate,
        summary: Object.values(tenantSummary)
      }
    });
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve attendance summary'
    });
  }
};

// Get utility settings for a property
exports.getUtilitySettings = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    if (!propertyId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Property ID is required'
      });
    }
    
    let settings = await UtilitySettings.findOne({ propertyId });
    
    // If settings don't exist, create default ones
    if (!settings) {
      settings = await UtilitySettings.create({
        propertyId,
        allowedDailyHours: 10,
        extraHourlyRate: 20,
        notifyExceededHours: true,
        notifyFinance: true
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        settings
      }
    });
  } catch (error) {
    console.error('Error getting utility settings:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update utility settings for a property
exports.updateUtilitySettings = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const {
      allowedDailyHours,
      extraHourlyRate,
      notifyExceededHours,
      notifyFinance,
      financeEmail,
      remarks
    } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Property ID is required'
      });
    }
    
    // Find existing settings or create new ones
    let settings = await UtilitySettings.findOne({ propertyId });
    
    if (!settings) {
      settings = await UtilitySettings.create({
        propertyId,
        allowedDailyHours: allowedDailyHours || 10,
        extraHourlyRate: extraHourlyRate || 20,
        notifyExceededHours: notifyExceededHours !== undefined ? notifyExceededHours : true,
        notifyFinance: notifyFinance !== undefined ? notifyFinance : true,
        financeEmail,
        remarks
      });
    } else {
      // Update existing settings
      if (allowedDailyHours !== undefined) settings.allowedDailyHours = allowedDailyHours;
      if (extraHourlyRate !== undefined) settings.extraHourlyRate = extraHourlyRate;
      if (notifyExceededHours !== undefined) settings.notifyExceededHours = notifyExceededHours;
      if (notifyFinance !== undefined) settings.notifyFinance = notifyFinance;
      if (financeEmail !== undefined) settings.financeEmail = financeEmail;
      if (remarks !== undefined) settings.remarks = remarks;
      
      await settings.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        settings
      }
    });
  } catch (error) {
    console.error('Error updating utility settings:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Finance alert for exceeded hours
exports.sendFinanceAlert = async (req, res) => {
  try {
    const {
      tenantId,
      tenantName,
      tenantEmail,
      roomId,
      roomNumber,
      exceededHours,
      extraCharge,
      date,
      recipientEmail,
      ccEmail,
      additionalNote
    } = req.body;
    
    // Validate required fields
    if (!tenantId || !tenantName || !roomNumber || !exceededHours || !recipientEmail) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields for finance alert'
      });
    }
    
    // Send email alert to finance department
    await EmailService.sendFinanceUtilityAlert({
      email: recipientEmail,
      ccEmail,
      tenantName,
      tenantId,
      roomNumber,
      roomId,
      exceededHours,
      extraCharge,
      date,
      additionalNote
    });
    
    // Also send notification to tenant if email is available
    if (tenantEmail) {
      await EmailService.sendUtilityExceededEmail({
        email: tenantEmail,
        name: tenantName,
        exceededHours,
        roomNumber,
        extraCharge
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Finance alert sent successfully',
      data: {
        sentTo: recipientEmail,
        cc: ccEmail || null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error sending finance alert:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to send finance alert'
    });
  }
};