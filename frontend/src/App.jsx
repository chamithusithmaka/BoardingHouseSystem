import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import './App.css';

// Admin Components
import AdminLayout from './Admin/Components/AdminLayout';
import Dashboard from './Admin/Pages/Dashboard';
import PropertyList from './Admin/Pages/Properties/PropertyList';
import RoomList from './Admin/Pages/Properties/RoomList';
import RoomDetails from './Admin/Pages/Rooms/RoomDetails';
import RoomRequestList from './Admin/Pages/Requests/RoomRequestList';
import RoomRequestDetail from './Admin/Pages/Requests/RoomRequestDetail';
import TransferRequestList from './Admin/Pages/Requests/TransferRequestList';
import TransferRequestDetail from './Admin/Pages/Requests/TransferRequestDetail';
import MoveOutRequestList from './Admin/Pages/Requests/MoveOutRequestList';
import MoveOutRequestDetail from './Admin/Pages/Requests/MoveOutRequestDetail';
import AttendanceDashboard from './Admin/Pages/Attendance/AttendanceDashboard';
import UtilitySettingsPage from './Admin/Pages/Attendance/UtilitySettingsPage';
import TenantAttendanceDetail from './Admin/Pages/Attendance/TenantAttendanceDetail';

// Feedback Components
import FeedbackList from './Admin/Pages/Feedback/FeedbackList';
import FeedbackDetail from './Admin/Pages/Feedback/FeedbackDetail';
import FeedbackStatistics from './Admin/Pages/Feedback/FeedbackStatistics';

// Meal Management Components
import MealsList from './Admin/Pages/Meals/MealsList';
import OrdersList from './Admin/Pages/Orders/OrdersList';

// In the imports section of App.jsx:
import MealBrowsePage from './Pages/Tenant/MealBrowsePage';
import MealCheckoutPage from './Pages/Tenant/MealCheckoutPage';
// User Components
import Header from './Components/Layout/Header';
import Footer from './Components/Layout/Footer';
import HomePage from './Pages/Home/HomePage';
import PropertyListingPage from './Pages/Properties/PropertyListingPage';
import PropertyDetailPage from './Pages/Properties/PropertyDetailPage';
import RoomListingPage from './Pages/Rooms/RoomListingPage';
import RoomDetailPage from './Pages/Rooms/RoomDetailPage';
import RoomRequestForm from './Pages/Rooms/RoomRequestForm';
import MyRoomPage from './Pages/Tenant/MyRoomPage';
import RegisterPage from './Pages/User/RegisterPage';
import ResetPassword from './Pages/User/ResetPassword';

// Supplier Components
import SupplierDashboard from './Supplier/Pages/Dashboard/SupplierDashboard';
import LoginPage from './Pages/User/LoginPage';

// Admin User Management Component
import UserManagement from './Admin/Pages/Users/UserManagement';
import UserProfile from './Pages/User/ProfilePage';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<PropertyList />} />
            <Route path="properties/:propertyId/rooms" element={<RoomList />} />
            <Route path="rooms/:roomId" element={<RoomDetails />} />
            <Route path="requests/room" element={<RoomRequestList />} />
            <Route path="requests/room/:id" element={<RoomRequestDetail />} />
            <Route path="requests/transfer" element={<TransferRequestList />} />
            <Route path="requests/transfer/:id" element={<TransferRequestDetail />} />
            <Route path="requests/moveout" element={<MoveOutRequestList />} />
            <Route path="requests/moveout/:id" element={<MoveOutRequestDetail />} />
            <Route path="attendance" element={<AttendanceDashboard />} />
            <Route path="attendance/settings" element={<UtilitySettingsPage />} />
            <Route path="attendance/:tenantId" element={<TenantAttendanceDetail />} />
            
            {/* Feedback Routes */}
            <Route path="feedback" element={<FeedbackList />} />
            <Route path="feedback/statistics" element={<FeedbackStatistics />} />
            <Route path="feedback/:id" element={<FeedbackDetail />} />
            
            {/* Meal Management Routes */}
            <Route path="meals" element={<MealsList />} />
            <Route path="orders" element={<OrdersList />} />
            
            {/* User Management Route */}
            <Route path="users" element={<UserManagement />} />
          </Route>
          
          {/* User Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertyListingPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/rooms" element={<RoomListingPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/rooms/:id/request" element={<RoomRequestForm />} />
          <Route path="/account/room" element={<MyRoomPage />} />
          <Route path="/account/meals" element={<MealBrowsePage />} />
          <Route path="/account/meals/checkout" element={<MealCheckoutPage />} />
          <Route path="/account/reset-password" element={<ResetPassword />} />
          
          {/* Supplier Routes */}
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account/profile" element={<UserProfile />} />


          {/* 404 Route */}
          <Route path="*" element={<div className="text-center p-20 text-gray-800">404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
