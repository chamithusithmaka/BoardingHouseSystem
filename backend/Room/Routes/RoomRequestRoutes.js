const express = require('express');
const roomRequestController = require('../Controllers/RoomRequestController');

const router = express.Router();

// Get all room requests
router.get('/', roomRequestController.getAllRoomRequests);

// Create new room request
router.post('/', roomRequestController.createRoomRequest);

// Get room requests by user
router.get('/user/:userId', roomRequestController.getUserRoomRequests);

// Get transfer requests specifically
router.get('/transfer', roomRequestController.getTransferRequests);

// Get specific room request
router.get('/:id', roomRequestController.getRoomRequest);

// Update room request
router.patch('/:id', roomRequestController.updateRoomRequest);

// Approve room request
router.patch('/:id/approve', roomRequestController.approveRoomRequest);

// Reject room request
router.patch('/:id/reject', roomRequestController.rejectRoomRequest);

// Delete room request
router.delete('/:id', roomRequestController.deleteRoomRequest);

module.exports = router;