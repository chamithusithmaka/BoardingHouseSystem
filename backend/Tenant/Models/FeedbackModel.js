const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {  // Add this new field
    type: String,
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  
  comments: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'read', 'responded', 'archived'],
    default: 'new'
  },
  adminResponse: {
    message: String,
    respondedBy: String,
    responseDate: Date
  }
}, {
  timestamps: true
});

// Add a pre-save hook to check required fields only on creation
feedbackSchema.pre('save', function(next) {
  // Only validate required fields on document creation, not on updates
  if (!this.isNew) {
    return next();
  }
  
  if (!this.userEmail) {
    const err = new Error('userEmail is required');
    return next(err);
  }
  
  next();
});

// Add a pre-update hook for findOneAndUpdate operations
feedbackSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Don't validate required fields on update operations
  if (update.$set && update.$set.userEmail === '') {
    delete update.$set.userEmail;
  }
  
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;