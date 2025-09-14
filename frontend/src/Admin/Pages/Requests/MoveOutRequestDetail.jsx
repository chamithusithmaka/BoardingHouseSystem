import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaSignOutAlt, 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaUserAlt,
  FaBed,
  FaCalendarDay,
  FaMapMarkerAlt
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MoveOutRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Fetch request details
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/rooms/moveout-requests/${id}`);
        
        if (response.data.status === 'success') {
          const requestData = response.data.data.request;
          setRequest(requestData);
          
          // Fetch room details
          if (requestData.roomId) {
            const roomResponse = await axios.get(`${API_URL}/rooms/${requestData.roomId}`);
            if (roomResponse.data.status === 'success') {
              setRoom(roomResponse.data.data.room);
            }
          }
        } else {
          setError('Failed to load request details');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching request details:', err);
        setError('An error occurred while fetching the request details');
        setLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [id]);

  // Handle request actions (approve/reject)
  const handleAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} this move-out request?`)) {
      return;
    }
    
    try {
      setProcessingAction(true);
      
      // Update the request status
      const status = action === 'approve' ? 'approved' : 'rejected';
      const message = adminMessage || 
        (action === 'approve' ? 'Your move-out request has been approved' : 'Your move-out request has been rejected');
      
      await axios.patch(`${API_URL}/rooms/moveout-requests/${id}`, {
        status,
        message
      });
      
      // Update UI
      setRequest(prev => ({ ...prev, status }));
      alert(`Move-out request ${action}d successfully`);
      
      // Redirect back to the list after a short delay
      setTimeout(() => {
        navigate('/admin/requests/moveout');
      }, 1500);
      
      setProcessingAction(false);
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      alert(`Failed to ${action} request: ${err.response?.data?.message || err.message}`);
      setProcessingAction(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-500';
    let textColor = 'text-white';
    
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-500';
        break;
      case 'approved':
        bgColor = 'bg-green-500';
        break;
      case 'rejected':
        bgColor = 'bg-red-500';
        break;
      case 'completed':
        bgColor = 'bg-blue-500';
        break;
      case 'cancelled':
        bgColor = 'bg-gray-500';
        break;
      default:
        break;
    }
    
    return (
      <span className={`${bgColor} ${textColor} px-3 py-1 rounded-full text-sm font-semibold uppercase`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/admin/requests/moveout"
          className="flex items-center text-blue-600 hover:underline"
        >
          <FaArrowLeft className="mr-2" />
          Back to Move-Out Requests
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-500 text-4xl" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      ) : request ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Overview */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <FaSignOutAlt className="mr-2 text-blue-500" />
                Move-Out Request
              </h1>
              <StatusBadge status={request.status} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Request Date</p>
                <p className="font-medium">{formatDate(request.requestDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Planned Move-Out Date</p>
                <p className="font-medium">{formatDate(request.moveOutDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Request ID</p>
                <p className="font-medium text-gray-700">{request._id}</p>
              </div>
            </div>
          </div>
          
          {/* Tenant Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaUserAlt className="mr-2 text-blue-500" />
              Tenant Information
            </h2>
            
            <div className="flex items-center mb-4">
              {request.tenantPhoto ? (
                <img 
                  src={request.tenantPhoto}
                  alt={request.tenantName}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                  <FaUserAlt className="text-gray-400 text-xl" />
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-lg">{request.tenantName}</h3>
                {request.tenantEmail && <p className="text-gray-600">{request.tenantEmail}</p>}
                {request.tenantPhone && <p className="text-gray-600">{request.tenantPhone}</p>}
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-2">Move-Out Reason:</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                {request.reason || "No reason provided"}
              </div>
            </div>
            
            {request.notes && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Additional Notes:</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {request.notes}
                </div>
              </div>
            )}
          </div>
          
          {/* Room Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaBed className="mr-2 text-blue-500" />
              Room Information
            </h2>
            
            {room ? (
              <>
                <div className="relative h-40 mb-4 rounded-lg overflow-hidden">
                  {room.images && room.images.length > 0 ? (
                    <img 
                      src={room.images[0]}
                      alt={`Room ${room.roomNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FaBed className="text-gray-400 text-4xl" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-lg mb-1">
                  {room.roomId || `Room ${room.roomNumber}`}
                </h3>
                
                {room.property && (
                  <p className="text-gray-600 flex items-center mb-3">
                    <FaMapMarkerAlt className="mr-1 text-gray-400" />
                    {room.property.name}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="font-medium">{room.occupants?.length || 0}/{room.capacity || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium capitalize">{room.status}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500">Monthly Rate</p>
                    <p className="font-medium">
                      {room.price?.amount ? `₱${room.price.amount.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-center">
                Room information not available
              </div>
            )}
          </div>
          
          {/* Tenant History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaCalendarDay className="mr-2 text-blue-500" />
              Tenant History
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Move-in Date:</span>
                <span>{formatDate(request.tenantMoveInDate)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duration:</span>
                <span>{request.tenantDuration || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.tenantPaymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                  request.tenantPaymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {request.tenantPaymentStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Admin Actions Panel */}
          {request.status === 'pending' && (
            <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Admin Actions</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="adminMessage">
                  Message to Tenant (Optional)
                </label>
                <textarea
                  id="adminMessage"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add a message that will be sent to the tenant along with your decision..."
                ></textarea>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={processingAction}
                  className={`px-6 py-3 rounded-lg flex items-center font-medium
                    ${processingAction
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {processingAction ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Approve Move-Out
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleAction('reject')}
                  disabled={processingAction}
                  className={`px-6 py-3 rounded-lg flex items-center font-medium
                    ${processingAction
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                >
                  {processingAction ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaTimes className="mr-2" />
                      Reject Move-Out
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Response Information (if already processed) */}
          {request.status !== 'pending' && request.adminResponse && (
            <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Admin Response</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Response Date</p>
                <p className="font-medium mb-4">{formatDate(request.adminResponse.responseDate)}</p>
                
                <p className="text-sm text-gray-500 mb-1">Message</p>
                <p className="whitespace-pre-wrap">{request.adminResponse.message || 'No message provided'}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          <p className="text-lg">Request not found</p>
        </div>
      )}
    </div>
  );
};

export default MoveOutRequestDetail;