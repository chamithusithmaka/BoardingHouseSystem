import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaExchangeAlt, 
  FaArrowLeft, 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaUserAlt,
  FaBed,
  FaCalendarDay,
  FaMapMarkerAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const TransferRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [targetRoom, setTargetRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Fetch request details
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        setLoading(true);
        
        // This endpoint was incorrect - it should be /room-requests/id
        // but your backend might be expecting transfer requests at a different endpoint
        const response = await axios.get(`${API_URL}/room-requests/${id}`);
        
        if (response.data.status === 'success') {
          const requestData = response.data.data.request;
          setRequest(requestData);
          
          // Fetch current and target room details
          if (requestData.currentRoomId) {
            try {
              const currentRoomResponse = await axios.get(`${API_URL}/rooms/${requestData.currentRoomId}`);
              if (currentRoomResponse.data.status === 'success') {
                setCurrentRoom(currentRoomResponse.data.data.room);
              }
            } catch (roomErr) {
              console.error('Error fetching current room:', roomErr);
            }
          }
          
          if (requestData.roomId) {
            try {
              const targetRoomResponse = await axios.get(`${API_URL}/rooms/${requestData.roomId}`);
              if (targetRoomResponse.data.status === 'success') {
                setTargetRoom(targetRoomResponse.data.data.room);
              }
            } catch (roomErr) {
              console.error('Error fetching target room:', roomErr);
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
    if (!window.confirm(`Are you sure you want to ${action} this transfer request?`)) {
      return;
    }
    
    try {
      setProcessingAction(true);
      
      // Update the request status
      const status = action === 'approve' ? 'approved' : 'rejected';
      const message = adminMessage || 
        (action === 'approve' ? 'Your transfer request has been approved' : 'Your transfer request has been rejected');
      
      await axios.patch(`${API_URL}/rooms/transfer-request`, {
        requestId: id,
        status,
        message
      });
      
      // Update UI
      setRequest(prev => ({ ...prev, status }));
      alert(`Transfer request ${action}d successfully`);
      
      // Redirect back to the list after a short delay
      setTimeout(() => {
        navigate('/admin/requests/transfer');
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
          to="/admin/requests/transfer"
          className="flex items-center text-blue-400 hover:text-blue-300"
        >
          <FaArrowLeft className="mr-2" />
          Back to Transfer Requests
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-500 text-4xl" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 p-4 mb-4 rounded">
          <div className="flex items-start">
            <FaExclamationTriangle className="mt-1 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      ) : request ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Overview */}
          <div className="lg:col-span-3 bg-gray-900 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <FaExchangeAlt className="mr-2 text-blue-500" />
                Room Transfer Request
              </h1>
              <StatusBadge status={request.status} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Request Date</p>
                <p className="font-medium text-white">{formatDate(request.requestDate)}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Preferred Move-in Date</p>
                <p className="font-medium text-white">{formatDate(request.moveInDate)}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Request ID</p>
                <p className="font-medium text-gray-300">{request._id}</p>
              </div>
            </div>
          </div>
          
          {/* Tenant Information */}
          <div className="bg-gray-900 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
              <FaUserAlt className="mr-2 text-blue-500" />
              Tenant Information
            </h2>
            
            <div className="flex items-center mb-4">
              {request.photo ? (
                <img 
                  src={request.photo}
                  alt={request.name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-800 mr-4 flex items-center justify-center">
                  <FaUserAlt className="text-gray-500 text-xl" />
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-lg text-white">{request.name}</h3>
                {request.email && <p className="text-gray-400">{request.email}</p>}
                {request.phone && <p className="text-gray-400">{request.phone}</p>}
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-2 text-white">Transfer Reason:</h3>
              <div className="bg-gray-800 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                {request.transferReason || request.reason || "No reason provided"}
              </div>
            </div>
            
            {request.notes && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 text-white">Additional Notes:</h3>
                <div className="bg-gray-800 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                  {request.notes}
                </div>
              </div>
            )}
          </div>
          
          {/* Current Room */}
          <div className="bg-gray-900 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
              <FaBed className="mr-2 text-blue-500" />
              Current Room
            </h2>
            
            {currentRoom ? (
              <>
                <div className="relative h-40 mb-4 rounded-lg overflow-hidden">
                  {currentRoom.images && currentRoom.images.length > 0 ? (
                    <img 
                      src={currentRoom.images[0]}
                      alt={`Room ${currentRoom.roomNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <FaBed className="text-gray-600 text-4xl" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-lg mb-1 text-white">
                  {currentRoom.roomId || `Room ${currentRoom.roomNumber}`}
                </h3>
                
                {currentRoom.property && (
                  <p className="text-gray-400 flex items-center mb-3">
                    <FaMapMarkerAlt className="mr-1 text-gray-500" />
                    {typeof currentRoom.property === 'object' ? currentRoom.property.name : ''}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="font-medium text-white">{currentRoom.occupants?.length || 0}/{currentRoom.capacity || 0}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium capitalize text-white">{currentRoom.status}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500">Monthly Rate</p>
                    <p className="font-medium text-white">
                      {currentRoom.price?.amount ? `₱${currentRoom.price.amount.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg text-gray-400 text-center">
                Current room information not available
              </div>
            )}
          </div>
          
          {/* Target Room */}
          <div className="bg-gray-900 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
              <FaExchangeAlt className="mr-2 text-blue-500" />
              Requested Room
            </h2>
            
            {targetRoom ? (
              <>
                <div className="relative h-40 mb-4 rounded-lg overflow-hidden">
                  {targetRoom.images && targetRoom.images.length > 0 ? (
                    <img 
                      src={targetRoom.images[0]}
                      alt={`Room ${targetRoom.roomNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <FaBed className="text-gray-600 text-4xl" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-lg mb-1 text-white">
                  {targetRoom.roomId || `Room ${targetRoom.roomNumber}`}
                </h3>
                
                {targetRoom.property && (
                  <p className="text-gray-400 flex items-center mb-3">
                    <FaMapMarkerAlt className="mr-1 text-gray-500" />
                    {typeof targetRoom.property === 'object' ? targetRoom.property.name : ''}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Capacity</p>
                    <p className="font-medium text-white">{targetRoom.occupants?.length || 0}/{targetRoom.capacity || 0}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-medium capitalize text-white">{targetRoom.status}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500">Monthly Rate</p>
                    <p className="font-medium text-white">
                      {targetRoom.price?.amount ? `₱${targetRoom.price.amount.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Availability warning */}
                {targetRoom.status === 'full' && (
                  <div className="mt-4 p-3 bg-red-900/30 text-red-400 rounded-lg flex items-start">
                    <FaTimes className="mt-1 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      This room is currently at full capacity. The transfer cannot be processed unless a spot becomes available.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg text-gray-400 text-center">
                Requested room information not available
              </div>
            )}
          </div>
          
          {/* Admin Actions Panel */}
          {request.status === 'pending' && (
            <div className="lg:col-span-3 bg-gray-900 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-white">Admin Actions</h2>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2" htmlFor="adminMessage">
                  Message to Tenant (Optional)
                </label>
                <textarea
                  id="adminMessage"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add a message that will be sent to the tenant along with your decision..."
                ></textarea>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={processingAction || (targetRoom && targetRoom.status === 'full')}
                  className={`px-6 py-3 rounded-lg flex items-center font-medium
                    ${processingAction || (targetRoom && targetRoom.status === 'full')
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
                      Approve Transfer
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleAction('reject')}
                  disabled={processingAction}
                  className={`px-6 py-3 rounded-lg flex items-center font-medium
                    ${processingAction
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
                      Reject Transfer
                    </>
                  )}
                </button>
              </div>
              
              {targetRoom && targetRoom.status === 'full' && (
                <div className="mt-4 p-3 bg-yellow-900/30 text-yellow-500 rounded-lg flex items-start">
                  <FaExclamationTriangle className="mt-1 mr-2 flex-shrink-0" />
                  <p className="text-sm">
                    The requested room is currently at full capacity. You cannot approve this transfer until space becomes available.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Response Information (if already processed) */}
          {request.status !== 'pending' && request.adminResponse && (
            <div className="lg:col-span-3 bg-gray-900 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-white">Admin Response</h2>
              
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Response Date</p>
                <p className="font-medium mb-4 text-white">{formatDate(request.adminResponse.responseDate)}</p>
                
                <p className="text-sm text-gray-400 mb-1">Message</p>
                <p className="whitespace-pre-wrap text-gray-300">{request.adminResponse.message || 'No message provided'}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
          <p className="text-lg">Request not found</p>
        </div>
      )}
    </div>
  );
};

export default TransferRequestDetail;