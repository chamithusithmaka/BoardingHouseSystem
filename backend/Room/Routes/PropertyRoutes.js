const express = require('express');
const propertyController = require('../Controllers/PropertyController');

const router = express.Router();

// GET all properties
router.get('/', propertyController.getAllProperties);

// POST new property
router.post('/', propertyController.createProperty);

// GET property by ID
router.get('/:id', propertyController.getProperty);

// PATCH update property
router.patch('/:id', propertyController.updateProperty);

// DELETE property
router.delete('/:id', propertyController.deleteProperty);

// GET all rooms for a property
router.get('/:id/rooms', propertyController.getPropertyRooms);

// GET statistics for a property
router.get('/:id/stats', propertyController.getPropertyStats);

module.exports = router;