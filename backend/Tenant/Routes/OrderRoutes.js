const express = require('express');
const router = express.Router();
const orderController = require('../Controllers/OrderController');

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders (with optional filters)
router.get('/', orderController.getAllOrders);

// Get orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

// Get order statistics
router.get('/stats', orderController.getOrderStats);

// IMPORTANT: The more specific route needs to be defined BEFORE the more general one
// Get monthly expense tracking by room number
router.get('/expenses/room/:roomNo', orderController.getMonthlyExpensesByRoom);

// Get monthly expense tracking by user ID
router.get('/expenses/:userId', orderController.getMonthlyExpensesByUser);

// Get a single order by ID
router.get('/:id', orderController.getOrderById);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

// Delete an order
router.delete('/:id', orderController.deleteOrder);

module.exports = router;