const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Property name is required'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'Philippines'
    }
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    type: String // URLs to property images
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Property must belong to an owner']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  amenities: [{
    type: String,
    enum: ['WiFi', 'Parking', 'Security', 'Laundry', 'Kitchen', 'Common Area', 'Other']
  }],
  active: {
    type: Boolean,
    default: true
  },
  contactInfo: {
    phone: String,
    email: String
  },
  propertyId: {
    type: String,
    unique: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate to get all rooms in a property
propertySchema.virtual('rooms', {
  ref: 'Room',
  foreignField: 'property',
  localField: '_id'
});

// Update timestamp on save
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.propertyId) {
    this.propertyId = this._id.toString();
  }
  next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;