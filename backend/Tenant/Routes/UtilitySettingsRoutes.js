const express = require('express');
const router = express.Router();
const utilitySettingsController = require('../Controllers/UtilitySettingsController');

// Get utility settings for a property
router.get('/:propertyId', utilitySettingsController.getUtilitySettings);

// Update utility settings for a property
router.put('/:propertyId', utilitySettingsController.updateUtilitySettings);

// Send utility settings via email
router.post('/:propertyId/send-email', utilitySettingsController.sendUtilitySettingsEmail);

module.exports = router;