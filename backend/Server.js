// backend/server.js

const express = require('express');
const connectDB = require('./config/db'); // Import the database connection
const dotenv = require('dotenv');
const cors = require('cors');

// Import routes
const propertyRoutes = require('./Room/Routes/PropertyRoutes');
const roomRoutes = require('./Room/Routes/RoomRoutes');
const attendanceRoutes = require('./Tenant/Routes/AttendanceRoutes'); // New import
const orderRoutes = require('./Tenant/Routes/OrderRoutes');
const mealRoutes = require('./Tenant/Routes/MealRoutes');
const UserRoutes = require('./User/routes/UserRoutes'); // New import
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increased limit for large payloads

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Mount routes
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room-requests', require('./Room/Routes/RoomRequestRoutes')); // New route mounting
app.use('/api/attendance', attendanceRoutes); // New route registration
app.use('/api/utility-settings', require('./Tenant/Routes/UtilitySettingsRoutes')); // New route registration
app.use('/api/feedback', require('./Tenant/Routes/FeedbackRoutes')); // New route registration
app.use('/api/orders', orderRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/notifications', require('./Supplier/Routes/NotificationRoutes'));
app.use('/api/users', UserRoutes); // New route registration
// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
