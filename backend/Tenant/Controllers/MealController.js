const Meal = require('../Models/Meal');

// Create a new meal
exports.createMeal = async (req, res) => {
  try {
    const mealData = req.body;
    
    // Validate that we have prices for at least one size
    if (!mealData.sizePrices || !mealData.sizePrices.length) {
      return res.status(400).json({
        status: 'fail',
        message: 'At least one size with price must be provided'
      });
    }
    
    // Validate that defaultSize is one of the sizes with prices
    if (!mealData.sizePrices.some(sp => sp.size === mealData.defaultSize)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Default size must be one of the provided sizes'
      });
    }
    
    const newMeal = await Meal.create(mealData);
    res.status(201).json({
      status: 'success',
      data: { meal: newMeal }
    });
  } catch (error) {
    console.error('Error creating meal:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all meals
exports.getAllMeals = async (req, res) => {
  try {
    const meals = await Meal.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: { meals }
    });
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get a single meal by ID
exports.getMealById = async (req, res) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Meal not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { meal }
    });
  } catch (error) {
    console.error('Error fetching meal:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update a meal
exports.updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const mealData = req.body;

    const updatedMeal = await Meal.findByIdAndUpdate(id, mealData, {
      new: true,
      runValidators: true
    });

    if (!updatedMeal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { meal: updatedMeal }
    });
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a meal
exports.deleteMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findByIdAndDelete(id);
    if (!meal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Meal not found'
      });
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add feedback to a meal
exports.addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactName, contactPhone, rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'fail',
        message: 'Rating must be between 1 and 5'
      });
    }

    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Meal not found'
      });
    }

    // Add feedback
    const feedback = { contactName, contactPhone, rating, comment };
    meal.feedbacks.push(feedback);

    // Save meal to update rating aggregates
    await meal.save();

    res.status(201).json({
      status: 'success',
      data: { feedback }
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get feedback for a meal
exports.getFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const meal = await Meal.findById(id).select('feedbacks');
    if (!meal) {
      return res.status(404).json({
        status: 'fail',
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { feedbacks: meal.feedbacks }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};