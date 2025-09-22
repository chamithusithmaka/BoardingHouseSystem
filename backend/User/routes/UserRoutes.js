const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// Login route
router.post('/login', UserController.login);

// Register route
router.post('/register', UserController.register);

// Check availability route
router.post('/check-availability', UserController.checkAvailability);

// Update user status route
router.patch('/users/:userId/status', UserController.updateUserStatus);

// Fetch all users (for admin)
router.get('/users', UserController.getAllUsers);

// Delete user route
router.delete('/users/:userId', UserController.deleteUser);

// Simple profile routes - no middleware
router.get('/profile/:userId', UserController.getUserProfileById);
router.put('/profile/:userId', UserController.updateUserProfileById);
router.delete('/profile/:userId', UserController.deleteUserAccountById);

// Reset password route
router.post('/reset-password/:userId', UserController.resetPassword);

module.exports = router;