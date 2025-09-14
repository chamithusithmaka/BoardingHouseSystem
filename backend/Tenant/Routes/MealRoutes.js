const express = require('express');
const router = express.Router();
const mealController = require('../Controllers/MealController');

// Create a new meal
router.post('/', mealController.createMeal);

// Get all meals
router.get('/', mealController.getAllMeals);

// Get a single meal by ID
router.get('/:id', mealController.getMealById);

// Update a meal
router.put('/:id', mealController.updateMeal);

// Delete a meal
router.delete('/:id', mealController.deleteMeal);

// Add feedback to a meal
router.post('/:id/feedback', mealController.addFeedback);

// Get feedback for a meal
router.get('/:id/feedback', mealController.getFeedback);

module.exports = router;