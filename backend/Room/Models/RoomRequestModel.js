const mongoose = require('mongoose');

// Update schema to include requestType field
const roomRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  currentRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  photo: {
    type: String // Base64 encoded image or URL
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  moveInDate: {
    type: Date,
    default: Date.now
  },
  
  // Add fields for move-out requests
  moveOutDate: Date,
  
  // Request type
  requestType: {
    type: String,
    enum: ['booking', 'transfer', 'moveout'],
    default: 'booking'
  },
  
  // For transfer requests
  isTransferRequest: {
    type: Boolean,
    default: false
  },
  transferReason: String,
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Admin response
  adminResponse: {
    adminId: String,
    responseDate: Date,
    message: String
  },
  
  // Timestamps
  requestDate: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for frequent queries
roomRequestSchema.index({ status: 1 });
roomRequestSchema.index({ requestType: 1 });
roomRequestSchema.index({ isTransferRequest: 1 });
roomRequestSchema.index({ email: 1 });
roomRequestSchema.index({ requestDate: -1 });

const RoomRequest = mongoose.model('RoomRequest', roomRequestSchema);

module.exports = RoomRequest;