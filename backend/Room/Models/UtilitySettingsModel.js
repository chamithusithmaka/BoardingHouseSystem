const mongoose = require('mongoose');

const utilitySettingsSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Property ID is required']
  },
  allowedDailyHours: {
    type: Number,
    default: 10,
    min: [1, 'Allowed hours must be at least 1']
  },
  extraHourlyRate: {
    type: Number,
    default: 20,
    min: [0, 'Extra hourly rate cannot be negative']
  },
  notifyExceededHours: {
    type: Boolean,
    default: true
  },
  notifyFinance: {
    type: Boolean,
    default: true
  },
  financeEmail: {
    type: String,
    validate: {
      validator: function(email) {
        if (!this.notifyFinance) return true;
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

const UtilitySettings = mongoose.model('UtilitySettings', utilitySettingsSchema);
module.exports = UtilitySettings;