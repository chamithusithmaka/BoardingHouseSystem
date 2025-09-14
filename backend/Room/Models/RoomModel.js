const mongoose = require('mongoose');

// Embedded tenant schema (not a separate collection)
const tenantSchema = new mongoose.Schema({
  _id: {
    type: String,  // Use String instead of ObjectId for user IDs
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  photo: {
    type: String  // Base64 encoded image
  },
  moveInDate: {
    type: Date,
    default: Date.now
  },
  contractEndDate: {
    type: Date
  },
  notes: String
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: [true, 'Room ID is required'],
    unique: true,
    trim: true
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    trim: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Room must belong to a property']
  },
  description: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    default: 1,
    min: [1, 'Capacity must be at least 1']
  },
  occupants: [tenantSchema], // Embedded tenant documents
  status: {
    type: String,
    required: true,
    enum: ['vacant', 'available', 'full', 'maintenance'],
    default: 'vacant'
  },
  facilities: [{
    type: String
  }],
  images: [{
    type: String // Base64 encoded images
  }],
  price: {
    amount: {
      type: Number,
      required: [true, 'Room price amount is required']
    },
    currency: {
      type: String,
      default: 'PHP'
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'monthly'
    }
  },
  size: {
    area: {
      type: String
    },
    unit: {
      type: String,
      enum: ['sqm', 'sqft'],
      default: 'sqm'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp on save
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-update status based on occupants
  if (!this.occupants) {
    this.status = 'vacant';
  } else if (this.occupants.length >= this.capacity) {
    this.status = 'full';
  } else if (this.occupants.length > 0) {
    this.status = 'available';
  } else {
    this.status = 'vacant';
  }
  
  next();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;