const UtilitySettings = require('../../Room/Models/UtilitySettingsModel');
const Property = require('../../Room/Models/PropertyModel');

// Get utility settings for a specific property
exports.getUtilitySettings = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Check if property exists
    const propertyExists = await Property.exists({ _id: propertyId });
    if (!propertyExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found'
      });
    }

    // Find or create settings
    let settings = await UtilitySettings.findOne({ propertyId });
    
    if (!settings) {
      // Return default settings if none exist
      return res.status(200).json({
        status: 'success',
        data: {
          settings: {
            propertyId,
            allowedDailyHours: 10,
            extraHourlyRate: 20,
            notifyExceededHours: true,
            notifyFinance: true,
            financeEmail: '',
            remarks: ''
          }
        }
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
      message: error.message || 'Failed to retrieve utility settings'
    });
  }
};

// Update utility settings for a property
exports.updateUtilitySettings = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists
    const propertyExists = await Property.exists({ _id: propertyId });
    if (!propertyExists) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found'
      });
    }

    // Validate inputs
    const { 
      allowedDailyHours, 
      extraHourlyRate, 
      notifyExceededHours, 
      notifyFinance, 
      financeEmail, 
      remarks 
    } = req.body;

    // Check if required fields exist
    if (allowedDailyHours === undefined || extraHourlyRate === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Required fields are missing'
      });
    }

    // Validate allowed hours
    if (allowedDailyHours < 1 || allowedDailyHours > 24) {
      return res.status(400).json({
        status: 'fail',
        message: 'Allowed hours must be between 1 and 24'
      });
    }

    // If notifyFinance is true, financeEmail is required
    if (notifyFinance && (!financeEmail || financeEmail.trim() === '')) {
      return res.status(400).json({
        status: 'fail',
        message: 'Finance email is required when finance notifications are enabled'
      });
    }

    // Create update object
    const updateData = {
      allowedDailyHours,
      extraHourlyRate,
      notifyExceededHours,
      notifyFinance,
      remarks
    };

    // Only include financeEmail if notifyFinance is true
    if (notifyFinance) {
      updateData.financeEmail = financeEmail;
    }

    // Update or create settings
    const settings = await UtilitySettings.findOneAndUpdate(
      { propertyId },
      { ...updateData, propertyId },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        settings
      }
    });
  } catch (error) {
    console.error('Error updating utility settings:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update utility settings'
    });
  }
};