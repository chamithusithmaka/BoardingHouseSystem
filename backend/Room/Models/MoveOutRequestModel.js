const mongoose = require('mongoose');

const moveOutRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  tenantName: {
    type: String,
    required: true
  },
  tenantEmail: {
    type: String,
    trim: true
  },
  tenantPhone: {
    type: String,
    trim: true
  },
  tenantPhoto: {
    type: String // URL or Base64
  },
  reason: {
    type: String,
    required: true
  },
  moveOutDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  adminResponse: {
    adminId: String,
    responseDate: Date,
    message: String
  },
  requestDate: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for frequent queries
moveOutRequestSchema.index({ status: 1 });
moveOutRequestSchema.index({ requestDate: -1 });
moveOutRequestSchema.index({ tenantEmail: 1 });

const MoveOutRequest = mongoose.model('MoveOutRequest', moveOutRequestSchema);

module.exports = MoveOutRequest;