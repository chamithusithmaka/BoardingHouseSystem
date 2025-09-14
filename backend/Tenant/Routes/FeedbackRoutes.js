const express = require('express');
const feedbackController = require('../Controllers/FeedbackController');

const router = express.Router();

// Create new feedback
router.post('/', feedbackController.createFeedback);

// Get all feedback with filtering and pagination
router.get('/', feedbackController.getAllFeedback);

// Get feedback statistics
router.get('/stats', feedbackController.getFeedbackStats);

// Get recent feedback by user ID
router.get('/user/:userId/recent', feedbackController.getRecentUserFeedback);

// Get feedback by ID
router.get('/:id', feedbackController.getFeedbackById);

// Update feedback
router.put('/:id', feedbackController.updateFeedback);

// Delete feedback
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;