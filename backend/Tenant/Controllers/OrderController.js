const Order = require('../Models/Order');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const newOrder = await Order.create(orderData);
    res.status(201).json({
      status: 'success',
      data: { order: newOrder }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all orders with optional filters
exports.getAllOrders = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { status, contactPhone, roomNo, userId, startDate, endDate } = req.query; // add userId
    
    // Build query object
    const query = {};
    
    // Add filters if provided
    if (status) {
      query.status = status;
    }
    
    if (contactPhone) {
      query.contactPhone = { $regex: contactPhone, $options: 'i' };
    }
    
    if (roomNo) {
      query.roomNo = { $regex: roomNo, $options: 'i' };
    }
 
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Execute query with sorting
    const orders = await Order.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get orders by status
exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status parameter
    const validStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status parameter'
      });
    }
    
    const orders = await Order.find({ status }).sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.status} orders:`, error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus, changedBy } = req.body;
    
    // Validate required fields
    if (!newStatus) {
      return res.status(400).json({
        status: 'fail',
        message: 'newStatus is required'
      });
    }
    
    // Validate status value
    const validStatuses = ['ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status value'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found'
      });
    }

    await order.updateStatus(newStatus, changedBy || 'admin');
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found'
      });
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalCents' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          totalRevenueCents: '$totalRevenue',
          _id: 0
        }
      }
    ]);
    
    // Add total orders and revenue
    const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalRevenueCents, 0);
    
    res.status(200).json({
      status: 'success',
      data: { 
        stats,
        summary: {
          totalOrders,
          totalRevenueCents: totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all orders for the supplier
exports.getAllOrdersForSupplier = async (req, res) => {
  try {
    // Extract supplierId from query or hardcode for now
    const { supplierId } = req.query;

    // Validate supplierId
    if (!supplierId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Supplier ID is required'
      });
    }

    // Fetch all orders (filter by supplierId if needed)
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    console.error('Error fetching orders for supplier:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get monthly expenses grouped by meal type for a specific user
exports.getMonthlyExpensesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        status: 'fail',
        message: 'User ID is required'
      });
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const expenses = await Order.aggregate([
      {
        $match: {
          userId: userId, // Now match by userId
          status: 'DELIVERED',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.mealType',
          totalSpent: { $sum: '$items.lineTotalCents' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          mealType: '$_id',
          totalSpentCents: '$totalSpent',
          itemCount: '$count',
          _id: 0
        }
      },
      { $sort: { mealType: 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: { expenses }
    });
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get monthly expenses grouped by meal type for a specific room
exports.getMonthlyExpensesByRoom = async (req, res) => {
  try {
    const { roomNo } = req.params;

    // Validate roomNo
    if (!roomNo) {
      return res.status(400).json({
        status: 'fail',
        message: 'Room number is required'
      });
    }

    // Get the current date and calculate the start of the month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate expenses grouped by meal type for the room
    const expenses = await Order.aggregate([
      {
        $match: {
          roomNo: roomNo, // Match orders by room number
          status: 'DELIVERED', // Only include delivered orders
          createdAt: { $gte: startOfMonth } // Only include orders from the current month
        }
      },
      {
        $unwind: '$items' // Flatten the items array
      },
      {
        $group: {
          _id: '$items.mealType', // Group by meal type
          totalSpent: { $sum: '$items.lineTotalCents' }, // Sum the total spent for each meal type
          count: { $sum: 1 } // Count the number of items for each meal type
        }
      },
      {
        $project: {
          mealType: '$_id',
          totalSpentCents: '$totalSpent',
          itemCount: '$count',
          _id: 0
        }
      },
      {
        $sort: { mealType: 1 } // Sort by meal type alphabetically
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: { expenses }
    });
  } catch (error) {
    console.error('Error fetching monthly expenses by room:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};