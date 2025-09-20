import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaMapMarkerAlt, FaUsers, FaCalendarAlt, FaExchangeAlt, 
  FaDoorOpen, FaBed, FaKey, FaCheck, FaSpinner, FaTimesCircle, 
  FaUserAlt, FaEnvelope, FaPhone, FaClipboardList, FaUtensils, FaShoppingCart
} from 'react-icons/fa';
import { useAuth } from '../../Context/AuthContext';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';
import RoomTransferModal from './RoomTransferModal';
import MoveOutModal from './MoveOutModal';
import AttendanceTracker from './AttendanceTracker';
import MealOrderComponent from './MealOrderComponent'; // Import the meal order component
import MyOrdersComponent from './MyOrdersComponent'; // Import the orders component
import ExpenseTrackingComponent from '../../Components/Tenant/ExpenseTrackingComponent';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MyRoomPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferRequests, setTransferRequests] = useState([]);
  const [moveOutRequests, setMoveOutRequests] = useState([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
  const [isMealOrderModalOpen, setIsMealOrderModalOpen] = useState(false); // New state for meal order modal
  const [activeTab, setActiveTab] = useState('room'); // New state for tab navigation
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [utilitySettings, setUtilitySettings] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    roomNo: ''
    // ...other fields if needed
  });

  // Fetch user's room
  useEffect(() => {
    const fetchUserRoom = async () => {
      if (!user || !user.id) {
        setError('You must be logged in to view this page');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/rooms/user/${user.id}/room`);
        
        setRoom(response.data.data.room);
        setTenant(response.data.data.tenant);

        // Auto-fill room number in contactInfo if available
        if (response.data.data.room && response.data.data.room.roomNumber) {
          setContactInfo(prev => ({
            ...prev,
            roomNo: response.data.data.room.roomNumber
          }));
        }
        
        // Fetch utility settings for the property
        if (response.data.data.room && response.data.data.room.property && response.data.data.room.property._id) {
          try {
            const propertyId = response.data.data.room.property._id;
            const settingsResponse = await axios.get(`${API_URL}/utility-settings/${propertyId}`);
            setUtilitySettings(settingsResponse.data.data.settings);
          } catch (settingsErr) {
            console.error('Error fetching utility settings:', settingsErr);
            // Set default settings if fetch fails
            setUtilitySettings({
              allowedDailyHours: 10,
              extraHourlyRate: 20
            });
          }
        }
        
        // Also fetch any pending transfer requests
        try {
          const requestsResponse = await axios.get(`${API_URL}/room-requests/user/${user.id}/transfers?status=pending`);
          const requests = requestsResponse.data.data.requests;
          
          // Make sure requests is an array and has pending transfer requests
          if (Array.isArray(requests) && requests.some(req => req.isTransferRequest === true && req.status === 'pending')) {
            setTransferRequests(requests.filter(req => req.isTransferRequest === true && req.status === 'pending'));
          } else {
            setTransferRequests([]);
          }
        } catch (requestErr) {
          console.error('Error fetching transfer requests:', requestErr);
          setTransferRequests([]);
        }
        
        // Only fetch PENDING move-out requests
        try {
          const moveOutResponse = await axios.get(`${API_URL}/rooms/moveout-requests?userId=${user.id}&status=pending`);
          if (moveOutResponse.data.status === 'success') {
            setMoveOutRequests(moveOutResponse.data.data.requests || []);
          }
        } catch (moveOutErr) {
          console.error('Error fetching move-out requests:', moveOutErr);
          setMoveOutRequests([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user room:', err);
        // Check specifically for 404 errors which indicate no room assigned
        if (err.response?.status === 404) {
          setError('You are not currently assigned to any room');
          setRoom(null);
          setTenant(null);
        } else {
          setError('Failed to load your room information. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchUserRoom();
  }, [user]);

  // Fetch available rooms for transfer when transfer modal opens
  const handleOpenTransferModal = async () => {
    try {
      setLoadingRooms(true);
      const response = await axios.get(`${API_URL}/rooms?status=available,vacant`);
      
      // Filter out the current room
      const filteredRooms = response.data.data.rooms.filter(r => r._id !== room._id);
      setAvailableRooms(filteredRooms);
      
      setLoadingRooms(false);
      setIsTransferModalOpen(true);
    } catch (err) {
      console.error('Error fetching available rooms:', err);
      alert('Failed to load available rooms. Please try again.');
      setLoadingRooms(false);
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get days since move-in
  const getDaysSinceMoveIn = () => {
    if (!tenant || !tenant.moveInDate) return 'N/A';
    
    const moveInDate = new Date(tenant.moveInDate);
    const today = new Date();
    const diffTime = today - moveInDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Update the fetchTransferRequests function to be more robust
  const fetchTransferRequests = async () => {
    if (!user || !user.id) return;
    
    try {
      console.log('Fetching transfer requests...');
      // Use the new dedicated endpoint
      const response = await axios.get(`${API_URL}/rooms/transfer-requests/user/${user.id}`);
      
      if (response.data.status === 'success') {
        const pendingRequests = response.data.data.requests || [];
        console.log(`Found ${pendingRequests.length} pending transfer requests`);
        setTransferRequests(pendingRequests);
      } else {
        console.warn('Failed to fetch transfer requests, setting to empty array');
        setTransferRequests([]);
      }
    } catch (err) {
      console.error('Error fetching transfer requests:', err);
      setTransferRequests([]);
    }
  };

  // Add this function near the other fetching functions:
  const fetchMoveOutRequests = async () => {
    if (!user || !user.id) return;
    
    try {
      const moveOutResponse = await axios.get(`${API_URL}/rooms/moveout-requests?userId=${user.id}&status=pending`);
      if (moveOutResponse.data.status === 'success') {
        setMoveOutRequests(moveOutResponse.data.data.requests || []);
      } else {
        setMoveOutRequests([]);
      }
    } catch (moveOutErr) {
      console.error('Error fetching move-out requests:', moveOutErr);
      setMoveOutRequests([]);
    }
  };

  // Update the onTransferSuccess handler to properly refresh the transfer requests
  const handleTransferSuccess = (shouldRefresh = false) => {
    setIsTransferModalOpen(false);
    
    // If shouldRefresh is true, fetch the latest transfer requests
    if (shouldRefresh) {
      console.log('Transfer request submitted successfully, refreshing transfer requests...');
      // Fetch transfer requests immediately to update UI
      fetchTransferRequests();
    }
  };

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">My Room</h1>
          
          {loading ? (
            <div className="flex justify-center my-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : error ? (
            // Error state remains the same...
            <div className="bg-gray-800 rounded-lg p-8 text-center max-w-2xl mx-auto">
              <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">{error}</h3>
              <p className="text-gray-400 mb-6">
                {error === 'You are not currently assigned to any room' 
                  ? 'Browse available rooms to submit a request.' 
                  : 'Please try refreshing the page or contact support for assistance.'}
              </p>
              <div className="flex justify-center">
                <Link 
                  to="/rooms"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Browse Rooms
                </Link>
              </div>
            </div>
          ) : room ? (
            <>
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-700 mb-6">
                <button
                  onClick={() => setActiveTab('room')}
                  className={`py-3 px-6 font-medium focus:outline-none ${
                    activeTab === 'room'
                      ? 'text-amber-500 border-b-2 border-amber-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Room Details
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-3 px-6 font-medium focus:outline-none flex items-center ${
                    activeTab === 'orders'
                      ? 'text-amber-500 border-b-2 border-amber-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <FaShoppingCart className="mr-2" />
                  My Orders
                </button>
              </div>

              {activeTab === 'room' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Room Information */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                      {/* Room details remain the same... */}
                      <div className="relative h-64">
                        {room.images && room.images.length > 0 ? (
                          <img 
                            src={room.images[0]} 
                            alt={`Room ${room.roomNumber}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <FaBed className="text-gray-500 text-5xl" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium
                            ${room.status === 'vacant' ? 'bg-green-500 text-white' : ''}
                            ${room.status === 'available' ? 'bg-blue-500 text-white' : ''}
                            ${room.status === 'full' ? 'bg-red-500 text-white' : ''}
                            ${room.status === 'maintenance' ? 'bg-yellow-500 text-white' : ''}
                          `}>
                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {/* Room details content remains the same... */}
                        <div className="flex flex-wrap items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">{room.roomId || `Room ${room.roomNumber}`}</h2>
                          <div className="text-amber-400 font-semibold">
                            LKR:{room.price?.amount?.toLocaleString() || 'N/A'} 
                            <span className="text-sm text-gray-400">/ {room.price?.period || 'month'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-400 mb-4">
                          <FaMapMarkerAlt className="mr-2 text-amber-500" />
                          <span>
                            {room.property?.name || 'Property'}, 
                            {room.property?.address?.city && ` ${room.property.address.city}`}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center text-center">
                            <FaUsers className="text-amber-500 mb-1" />
                            <span className="text-sm text-gray-300">Occupancy</span>
                            <span className="font-semibold">{room.occupants?.length || 0} / {room.capacity || 0}</span>
                          </div>
                          
                          <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center text-center">
                            <FaCalendarAlt className="text-amber-500 mb-1" />
                            <span className="text-sm text-gray-300">Move-in Date</span>
                            <span className="font-semibold">{formatDate(tenant?.moveInDate)}</span>
                          </div>
                          
                          <div className="bg-gray-700 p-3 rounded-md flex flex-col items-center text-center">
                            <FaKey className="text-amber-500 mb-1" />
                            <span className="text-sm text-gray-300">Days as Tenant</span>
                            <span className="font-semibold">{getDaysSinceMoveIn()}</span>
                          </div>
                        </div>
                        
                        {room.description && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Room Description</h3>
                            <p className="text-gray-300">{room.description}</p>
                          </div>
                        )}
                        
                        {room.facilities && room.facilities.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Room Facilities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {room.facilities.map((facility, index) => (
                                <div key={index} className="flex items-center">
                                  <FaCheck className="text-green-500 mr-2" />
                                  <span className="text-gray-300">{facility}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Room Options */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                      <h3 className="text-lg font-semibold mb-4">Room Options</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={handleOpenTransferModal}
                          disabled={transferRequests.length > 0 || loading}
                          className={`flex items-center justify-center p-4 rounded-md transition-colors
                            ${transferRequests.length > 0 || loading
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                          {loading ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <FaExchangeAlt className="mr-3" />
                              <span>Request Room Transfer</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setIsMoveOutModalOpen(true)}
                          disabled={moveOutRequests.length > 0}
                          className={`flex items-center justify-center p-4 rounded-md transition-colors
                            ${moveOutRequests.length > 0 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                          <FaDoorOpen className="mr-3" />
                          <span>Request to Move Out</span>
                        </button>

                        {/* Order Meal Button */}
                        <Link
                          to="/account/meals"
                          state={{ roomNo: room.roomNumber }} // Pass room number in navigation state
                          className="flex items-center justify-center p-4 rounded-md transition-colors bg-green-600 hover:bg-green-700 text-white"
                        >
                          <FaUtensils className="mr-3" />
                          <span>View Menu</span>
                        </Link>
                      </div>
                      
                      {/* Request status messages remain the same... */}
                      {transferRequests.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-900/30 border border-blue-800 rounded-md">
                          <div className="flex items-start">
                            <div>
                              <p className="text-blue-100 font-medium">Pending Transfer Request</p>
                              <p className="text-blue-200 text-sm mt-1">
                                You already have a pending transfer request. Please wait for admin approval.
                              </p>
                            </div>
                          </div>
                          
                        </div>
                      )}
                      
                      {moveOutRequests.length > 0 && (
                        <div className="mt-4 p-4 bg-red-900/30 border border-red-800 rounded-md">
                          <div className="flex items-start">
                            <div>
                              <p className="text-red-100 font-medium">Pending Move-Out Request</p>
                              <p className="text-red-200 text-sm mt-1">
                                You already have a pending request to move out. Please wait for admin approval.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Move ExpenseTrackingComponent here */}
                    <ExpenseTrackingComponent userId={user?.id} />
                  </div>
                  
                  {/* Sidebar with Attendance Tracker */}
                  <div className="space-y-6">
                    {/* Attendance Tracker Component */}
                    <AttendanceTracker 
                      user={user} 
                      room={room} 
                      tenant={tenant}
                      utilitySettings={utilitySettings}
                    />
                    
                    {/* Room Status */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                      <h3 className="text-lg font-semibold mb-4">Room Status</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium
                            ${room.status === 'vacant' ? 'bg-green-500 text-white' : ''}
                            ${room.status === 'available' ? 'bg-blue-500 text-white' : ''}
                            ${room.status === 'full' ? 'bg-red-500 text-white' : ''}
                            ${room.status === 'maintenance' ? 'bg-yellow-500 text-white' : ''}
                          `}>
                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Roommates:</span>
                          <span>{room.occupants?.length - 1 || 0}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Room Type:</span>
                          <span>{room.size?.type || 'Standard'}</span>
                        </div>
                        
                        {room.size?.area && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Room Size:</span>
                            <span>{room.size.area} {room.size.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Orders tab content
                <MyOrdersComponent user={user} room={room} />
              )}
            </>
          ) : (
            // No room assigned content remains the same...
            <div className="bg-gray-800 rounded-lg p-8 text-center max-w-2xl mx-auto">
              <FaTimesCircle className="text-red-500 text-5xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">No Room Assigned</h3>
              <p className="text-gray-400 mb-6">
                You are not currently assigned to any room. Browse available rooms to submit a request.
              </p>
              <div className="flex justify-center">
                <Link 
                  to="/rooms"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Browse Rooms
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Room Transfer Modal */}
        {isTransferModalOpen && (
          <RoomTransferModal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            currentRoom={room}
            availableRooms={availableRooms}
            loadingRooms={loadingRooms}
            tenant={tenant}
            userId={user?.id}
            onTransferSuccess={handleTransferSuccess}
          />
        )}
        
        {/* Move Out Modal */}
        {isMoveOutModalOpen && (
          <MoveOutModal
            isOpen={isMoveOutModalOpen}
            onClose={() => setIsMoveOutModalOpen(false)}
            room={room}
            tenant={tenant}
            onMoveOut={() => {
              setIsMoveOutModalOpen(false);
              window.location.reload();
            }}
          />
        )}
        
        {/* Meal Order Modal */}
        {isMealOrderModalOpen && (
          <MealOrderComponent
            isOpen={isMealOrderModalOpen}
            onClose={() => setIsMealOrderModalOpen(false)}
            user={user}
            room={room}
            onOrderPlaced={() => {
              setIsMealOrderModalOpen(false);
              setActiveTab('orders'); // Switch to orders tab after placing an order
            }}
          />
        )}
      </main>
      <Footer />
    </>
  );
};

export default MyRoomPage;