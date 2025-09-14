const Property = require('../Models/PropertyModel');
const Room = require('../Models/RoomModel');
const mongoose = require('mongoose');

// Get all properties
exports.getAllProperties = async (req, res) => {
  try {
    // Find all properties
    const properties = await Property.find();
    
    // Get room data for all properties in one go
    const propertiesWithRoomData = await Promise.all(
      properties.map(async (property) => {
        const rooms = await Room.find({ property: property._id });
        const occupiedRooms = rooms.filter(room => room.status === 'full').length;
        
        // Create a plain object from the Mongoose document and add room data
        const propertyObj = property.toObject();
        propertyObj.roomCount = rooms.length;
        propertyObj.occupiedRoomCount = occupiedRooms;
        
        return propertyObj;
      })
    );
    
    res.status(200).json({
      status: 'success',
      results: propertiesWithRoomData.length,
      data: {
        properties: propertiesWithRoomData
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single property
exports.getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('rooms');
    
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        property
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create new property
exports.createProperty = async (req, res) => {
  try {
    const newProperty = await Property.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        property: newProperty
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        property
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Delete property
exports.deleteProperty = async (req, res) => {
  try {
    // Check if property has rooms before deleting
    const roomCount = await Room.countDocuments({ property: req.params.id });
    
    if (roomCount > 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cannot delete property with existing rooms. Delete or reassign rooms first.'
      });
    }
    
    const property = await Property.findByIdAndDelete(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        status: 'fail',
        message: 'Property not found'
      });
    }
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all rooms for a specific property
exports.getPropertyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ property: req.params.id });
    
    res.status(200).json({
      status: 'success',
      results: rooms.length,
      data: {
        rooms
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get property statistics (room counts by status)
exports.getPropertyStats = async (req, res) => {
  try {
    const stats = await Room.aggregate([
      {
        $match: { property: new mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          rooms: { $push: '$roomId' }
        }
      }
    ]);
    
    // Transform to more friendly format
    const formattedStats = {
      total: 0,
      available: 0,
      full: 0,
      vacant: 0,
      maintenance: 0
    };
    
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        stats: formattedStats
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};