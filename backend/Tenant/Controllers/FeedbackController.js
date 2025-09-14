const Feedback = require('../Models/FeedbackModel');
const EmailService = require('../../Services/EmailService');

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail, // Add this
      roomId,
      propertyId,
      comments
    } = req.body;
    
    // Validate required fields
    if (!userId || !userName || !roomId || !userEmail) { // Include email validation
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields: userId, userName, userEmail, and roomId are required'
      });
    }
    
    // Create new feedback
    const feedback = await Feedback.create({
      userId,
      userName,
      userEmail, // Save the email
      roomId,
      propertyId,
      comments,
      status: 'new'
    });
    
    // Notify admin about new feedback
    try {
      await EmailService.sendAdminNotification({
        subject: 'New Tenant Feedback',
        message: `Tenant ${userName} (${userId}) has submitted new feedback.`
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        feedback
      }
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all feedback with filtering and pagination
exports.getAllFeedback = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      propertyId,
      userId
    } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (propertyId) filter.propertyId = propertyId;
    if (userId) filter.userId = userId;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Create sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get feedback with pagination
    const feedback = await Feedback.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('roomId', 'roomNumber roomId')
      .populate('propertyId', 'name location');
    
    // Get total count for pagination
    const total = await Feedback.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      results: feedback.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        feedback
      }
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get feedback by ID
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findById(id)
      .populate('roomId', 'roomNumber roomId')
      .populate('propertyId', 'name location');
    
    if (!feedback) {
      return res.status(404).json({
        status: 'fail',
        message: 'Feedback not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        feedback
      }
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get recent feedback by user ID
exports.getRecentUserFeedback = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get the most recent feedback from this user within the last 48 hours
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    
    const feedback = await Feedback.findOne({
      userId,
      createdAt: { $gte: twoDaysAgo }
    })
      .sort({ createdAt: -1 })
      .populate('roomId', 'roomNumber roomId')
      .populate('propertyId', 'name location');
    
    res.status(200).json({
      status: 'success',
      data: {
        feedback
      }
    });
  } catch (error) {
    console.error('Error getting user feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update feedback
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      comments,
      status,
      adminResponse,
      userEmail, // Add this to handle email updates
      userName    // Add this to handle name updates
    } = req.body;
    
    // Find feedback
    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
      return res.status(404).json({
        status: 'fail',
        message: 'Feedback not found'
      });
    }
    
    // Update fields
    if (comments !== undefined) feedback.comments = comments;
    if (status) feedback.status = status;
    if (userEmail) feedback.userEmail = userEmail; // Add this line to update email
    if (userName) feedback.userName = userName;    // Add this line to update name
    
    // Handle admin response
    if (adminResponse && adminResponse.message) {
      feedback.adminResponse = {
        message: adminResponse.message,
        respondedBy: adminResponse.respondedBy || 'Admin',
        responseDate: new Date()
      };
      feedback.status = 'responded';
      
      // Send response email directly to the email provided by the tenant
      if (feedback.userEmail) {
        try {
          await EmailService.sendTenantFeedbackResponse({
            email: feedback.userEmail,
            name: feedback.userName,
            adminResponse: adminResponse.message
          });
        } catch (emailError) {
          console.error('Failed to send feedback response email:', emailError);
        }
      }
    }
    
    await feedback.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        feedback
      }
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await Feedback.findByIdAndDelete(id);
    
    if (!feedback) {
      return res.status(404).json({
        status: 'fail',
        message: 'Feedback not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get feedback statistics
exports.getFeedbackStats = async (req, res) => {
  try {
    // Basic statistics about feedback
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          newCount: { 
            $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } 
          },
          respondedCount: { 
            $sum: { $cond: [{ $eq: ["$status", "responded"] }, 1, 0] } 
          },
          archivedCount: { 
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } 
          }
        }
      }
    ]);
    
    // Recent feedback trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTrends = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        stats: stats.length > 0 ? stats[0] : {
          totalCount: 0,
          newCount: 0,
          respondedCount: 0,
          archivedCount: 0
        },
        recentTrends
      }
    });
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};