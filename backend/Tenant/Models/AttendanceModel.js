const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: [true, 'Tenant ID is required']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room ID is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  checkInTime: {
    type: Date,
    required: [true, 'Check-in time is required']
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,  // Duration in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out', 'absent', 'exceeded-limit'],
    default: 'checked-in'
  },
  exceededHours: {
    type: Number,
    default: 0
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster querying by tenant and date
attendanceSchema.index({ tenantId: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;