const express = require('express');
const roomController = require('../Controllers/RoomController');

const router = express.Router();

// Transfer request routes - ADD THESE AT THE TOP
router.get('/transfer-requests', roomController.getTransferRequests);
router.post('/transfer-request', roomController.createTransferRequest);
router.patch('/transfer-request', roomController.updateTransferRequest);
router.delete('/transfer-requests/all', roomController.deleteAllTransferRequests);
router.delete('/transfer-request/:id', roomController.deleteTransferRequest); // Add this route
router.get('/transfer-requests/user/:userId', roomController.getUserTransferRequests); // Add this route near the other transfer request routes

// Move-out request routes - ADD THESE NEXT
router.get('/moveout-requests', roomController.getMoveOutRequests);
router.get('/moveout-requests/:id', roomController.getMoveOutRequestById);
router.patch('/moveout-requests/:id', roomController.updateMoveOutRequest);
router.post('/moveout-request', roomController.createMoveOutRequest);
router.delete('/moveout-requests/:id', roomController.deleteMoveOutRequest); // Add this route to handle deletion of move-out requests

// Then the existing routes
router.get('/', roomController.getAllRooms);
router.post('/', roomController.createRoom);
router.get('/:id', roomController.getRoom);
router.patch('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);

// POST allocate tenant to room
router.post('/allocate', roomController.allocateRoom);

// POST add tenant to room
router.post('/:id/tenants', roomController.addTenant);

// DELETE remove tenant from room
router.delete('/:id/tenants/:tenantId', roomController.removeTenant);

// PATCH update tenant in room
router.patch('/:id/tenants/:tenantId', roomController.updateTenant);

// GET all tenants
router.get('/tenants', roomController.getAllTenants);

// GET user's current room (for My Room page)
router.get('/user/:userId/room', roomController.getUserRoom);

// Add this route to handle move-out requests for a specific room
router.post('/:id/moveout', roomController.requestMoveOut);

// Add this to your routes file
router.post('/move-out-requests/check-consistency', roomController.checkMoveOutRequestConsistency);

module.exports = router;