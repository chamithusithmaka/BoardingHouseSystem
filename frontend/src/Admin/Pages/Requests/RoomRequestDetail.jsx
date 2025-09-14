import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, 
  FaExchangeAlt, FaDoorOpen, FaCheckCircle, FaTimesCircle, 
  FaSpinner, FaBuilding, FaBed, FaFileAlt, FaMapMarkerAlt
} from 'react-icons/fa';
import AdminLayout from '../../Components/AdminLayout';
import ConfirmDialog from '../../Components/Common/ConfirmDialog';
import ImageGallery from '../../Components/Common/ImageGallery';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const RoomRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [targetRoom, setTargetRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestType, setRequestType] = useState('regular'); // regular, transfer, moveout

  // Fetch request data
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/room-requests/${id}`);
        const requestData = response.data.data.request;
        setRequest(requestData);
        
        // Determine request type
        if (requestData.isTransferRequest) {
          setRequestType('transfer');
          
          // Fetch current room details for transfer requests
          if (requestData.currentRoomId) {
            const currentRoomResponse = await axios.get(`${API_URL}/rooms/${requestData.currentRoomId}`);
            setCurrentRoom(currentRoomResponse.data.data.room);
          }
        } else if (requestData.reason && requestData.reason.toLowerCase().includes('move out')) {
          setRequestType('moveout');
        } else {
          setRequestType('regular');
        }
        
        // Fetch target room details
        if (requestData.roomId) {
          const targetRoomResponse = await axios.get(`${API_URL}/rooms/${requestData.roomId}`);
          setTargetRoom(targetRoomResponse.data.data.room);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching request details:', err);
        setError('Failed to load request details. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      fetchRequestData();
    }
  }, [id]);

  // Handle request approval
  const handleApprove = async () => {
    try {
      setSubmitting(true);
      console.log(`Approving request ID: ${id}`);
      console.log(`Admin message: "${adminMessage}"`);
      
      // Use the correct endpoint URL structure
      const endpoint = `${API_URL}/room-requests/${id}/approve`;
      console.log(`Sending request to: ${endpoint}`);
      
      const response = await axios.patch(endpoint, { message: adminMessage });
      console.log('Server response:', response.data);
      
      setSubmitting(false);
      setIsApproveDialogOpen(false);
      
      // Refresh the request data
      const requestResponse = await axios.get(`${API_URL}/room-requests/${id}`);
      setRequest(requestResponse.data.data.request);
      
      alert("Request approved successfully");
    } catch (err) {
      console.error('Error approving request:', err);
      console.log('Error response:', err.response?.data);
      alert(`Failed to approve request: ${err.response?.data?.message || 'Please try again.'}`);
      setSubmitting(false);
    }
  };

  // Handle request rejection
  const handleReject = async () => {
    try {
      setSubmitting(true);
      console.log(`Rejecting request ID: ${id}`);
      console.log(`Admin message: "${adminMessage}"`);
      
      // Use the correct endpoint URL structure
      const endpoint = `${API_URL}/room-requests/${id}/reject`;
      console.log(`Sending request to: ${endpoint}`);
      
      const response = await axios.patch(endpoint, { message: adminMessage });
      console.log('Server response:', response.data);
      
      setSubmitting(false);
      setIsRejectDialogOpen(false);
      
      // Refresh the request data
      const requestResponse = await axios.get(`${API_URL}/room-requests/${id}`);
      setRequest(requestResponse.data.data.request);
      
      alert("Request rejected successfully");
    } catch (err) {
      console.error('Error rejecting request:', err);
      console.log('Error response:', err.response?.data);
      alert(`Failed to reject request: ${err.response?.data?.message || 'Please try again.'}`);
      setSubmitting(false);
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

  // Get status badge
  const getStatusBadge = () => {
    if (!request) return null;
    
    switch (request.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
            <FaSpinner className="mr-2 animate-spin" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <FaCheckCircle className="mr-2" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full">
            <FaTimesCircle className="mr-2" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
            {request.status}
          </span>
        );
    }
  };

  // Get request type badge
  const getRequestTypeBadge = () => {
    switch (requestType) {
      case 'transfer':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            <FaExchangeAlt className="mr-2" />
            Room Transfer
          </span>
        );
      case 'moveout':
        return (
          <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
            <FaDoorOpen className="mr-2" />
            Move Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <FaUser className="mr-2" />
            New Tenant
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/admin/requests')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft className="mr-2" />
            Back to Requests
          </button>
          
          <div className="flex space-x-4">
            {request && request.status === 'pending' && (
              <>
                <button
                  onClick={() => setIsRejectDialogOpen(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  <FaTimesCircle className="inline mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => setIsApproveDialogOpen(true)}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  <FaCheckCircle className="inline mr-2" />
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Request details */}
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <FaSpinner className="animate-spin text-blue-500 mr-3" size={24} />
            <span>Loading request details...</span>
          </div>
        ) : !request ? (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">Request not found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main request info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Request Details</h2>
                    <div className="flex space-x-3">
                      {getStatusBadge()}
                      {getRequestTypeBadge()}
                    </div>
                  </div>
                  
                  {/* Request timeline */}
                  <div className="border-l-2 border-gray-200 pl-4 mb-6">
                    <div className="relative mb-4">
                      <div className="absolute -left-6 mt-2 w-4 h-4 bg-blue-500 rounded-full"></div>
                      <p className="text-sm text-gray-500">Requested on {formatDate(request.requestDate)}</p>
                      <p className="font-medium">Request submitted by {request.name}</p>
                    </div>
                    
                    {request.status === 'pending' ? (
                      <div className="relative">
                        <div className="absolute -left-6 mt-2 w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm text-gray-500">Now</p>
                        <p className="font-medium">Awaiting admin review</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className={`absolute -left-6 mt-2 w-4 h-4 rounded-full ${
                          request.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <p className="text-sm text-gray-500">{formatDate(request.adminResponse?.responseDate)}</p>
                        <p className="font-medium">
                          Request {request.status} by Admin
                        </p>
                        {request.adminResponse?.message && (
                          <p className="text-gray-600 mt-1 italic">
                            "{request.adminResponse.message}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Request content */}
                  <div className="mb-6 border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium mb-3">Request Information</h3>
                    
                    {requestType === 'transfer' && (
                      <div className="flex flex-col space-y-2 mb-4">
                        <div className="flex items-center">
                          <FaExchangeAlt className="text-blue-500 mr-2" />
                          <span className="font-medium">Room Transfer Request</span>
                        </div>
                        <p className="text-gray-600">
                          <span className="font-medium">From:</span> {currentRoom?.roomId || `Room ${currentRoom?.roomNumber}` || 'Current Room'}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">To:</span> {targetRoom?.roomId || `Room ${targetRoom?.roomNumber}` || 'New Room'}
                        </p>
                      </div>
                    )}
                    
                    {requestType === 'moveout' && (
                      <div className="flex flex-col space-y-2 mb-4">
                        <div className="flex items-center">
                          <FaDoorOpen className="text-orange-500 mr-2" />
                          <span className="font-medium">Move Out Request</span>
                        </div>
                        <p className="text-gray-600">
                          <span className="font-medium">From Room:</span> {targetRoom?.roomId || `Room ${targetRoom?.roomNumber}` || 'Current Room'}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Move-in Date</p>
                        <p className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-2" />
                          {formatDate(request.moveInDate)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Request Date</p>
                        <p className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-2" />
                          {formatDate(request.requestDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Reason</p>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <p>{request.reason}</p>
                      </div>
                    </div>
                    
                    {request.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Additional Notes</p>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          <p>{request.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Room Information */}
              {targetRoom && (
                <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">
                      {requestType === 'transfer' ? 'Target Room Information' : 'Room Information'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Room ID</p>
                        <p className="flex items-center">
                          <FaBed className="text-gray-400 mr-2" />
                          {targetRoom.roomId || `Room ${targetRoom.roomNumber}`}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Property</p>
                        <p className="flex items-center">
                          <FaBuilding className="text-gray-400 mr-2" />
                          {targetRoom.property?.name || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          targetRoom.status === 'vacant' ? 'bg-green-100 text-green-800' :
                          targetRoom.status === 'available' ? 'bg-blue-100 text-blue-800' :
                          targetRoom.status === 'full' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {targetRoom.status.charAt(0).toUpperCase() + targetRoom.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Capacity</p>
                        <p className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          {targetRoom.occupants?.length || 0} / {targetRoom.capacity || 0}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p>
                          ₱{targetRoom.price?.amount?.toLocaleString() || 'N/A'} / {targetRoom.price?.period || 'month'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="flex items-center">
                          <FaMapMarkerAlt className="text-gray-400 mr-2" />
                          {targetRoom.property?.address?.city || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {targetRoom.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="mt-1">{targetRoom.description}</p>
                      </div>
                    )}
                    
                    {/* Room images */}
                    {targetRoom.images && targetRoom.images.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Room Images</p>
                        <ImageGallery images={targetRoom.images} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Current Room for Transfer Requests */}
              {requestType === 'transfer' && currentRoom && (
                <div className="bg-white rounded-lg shadow mt-6 overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">Current Room Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Room ID</p>
                        <p className="flex items-center">
                          <FaBed className="text-gray-400 mr-2" />
                          {currentRoom.roomId || `Room ${currentRoom.roomNumber}`}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Property</p>
                        <p className="flex items-center">
                          <FaBuilding className="text-gray-400 mr-2" />
                          {currentRoom.property?.name || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          currentRoom.status === 'vacant' ? 'bg-green-100 text-green-800' :
                          currentRoom.status === 'available' ? 'bg-blue-100 text-blue-800' :
                          currentRoom.status === 'full' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {currentRoom.status.charAt(0).toUpperCase() + currentRoom.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Capacity</p>
                        <p className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          {currentRoom.occupants?.length || 0} / {currentRoom.capacity || 0}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p>
                          ₱{currentRoom.price?.amount?.toLocaleString() || 'N/A'} / {currentRoom.price?.period || 'month'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Tenant information sidebar */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Tenant Information</h3>
                
                <div className="flex items-center mb-6">
                  {request.photo ? (
                    <img
                      src={request.photo}
                      alt={request.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <FaUser className="text-gray-400 text-2xl" />
                    </div>
                  )}
                  <div className="ml-4">
                    <h4 className="font-medium text-lg">{request.name}</h4>
                    <p className="text-gray-600">Tenant</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  {request.email && (
                    <div className="flex items-center">
                      <FaEnvelope className="text-gray-400 w-5 mr-3" />
                      <span>{request.email}</span>
                    </div>
                  )}
                  
                  {request.phone && (
                    <div className="flex items-center">
                      <FaPhone className="text-gray-400 w-5 mr-3" />
                      <span>{request.phone}</span>
                    </div>
                  )}
                </div>
                
                {request.status === 'pending' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsRejectDialogOpen(true)}
                      className="w-full py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 mb-3"
                    >
                      <FaTimesCircle className="inline mr-2" />
                      Reject Request
                    </button>
                    <button
                      onClick={() => setIsApproveDialogOpen(true)}
                      className="w-full py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      <FaCheckCircle className="inline mr-2" />
                      Approve Request
                    </button>
                  </div>
                )}
                
                {request.status === 'approved' && (
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <span className="font-medium">Request Approved</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      This request was approved on {formatDate(request.adminResponse?.responseDate)}.
                    </p>
                    {request.adminResponse?.message && (
                      <p className="text-sm italic mt-2">
                        "{request.adminResponse.message}"
                      </p>
                    )}
                  </div>
                )}
                
                {request.status === 'rejected' && (
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <div className="flex items-center">
                      <FaTimesCircle className="text-red-500 mr-2" />
                      <span className="font-medium">Request Rejected</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      This request was rejected on {formatDate(request.adminResponse?.responseDate)}.
                    </p>
                    {request.adminResponse?.message && (
                      <p className="text-sm italic mt-2">
                        "{request.adminResponse.message}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={isApproveDialogOpen}
        onClose={() => {
          setIsApproveDialogOpen(false);
          setAdminMessage('');
        }}
        title={
          requestType === 'transfer'
            ? 'Approve Room Transfer Request'
            : requestType === 'moveout'
            ? 'Approve Move Out Request'
            : 'Approve Room Request'
        }
        onConfirm={handleApprove}
        confirmButtonText="Approve"
        confirmButtonColor="green"
        isProcessing={submitting}
      >
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            {requestType === 'transfer'
              ? 'Are you sure you want to approve this room transfer request? This will move the tenant from their current room to the requested room.'
              : requestType === 'moveout'
              ? 'Are you sure you want to approve this move out request? This will remove the tenant from their current room.'
              : 'Are you sure you want to approve this room request? This will allocate the tenant to the requested room.'}
          </p>
          
          <div className="mt-4">
            <label htmlFor="adminMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Message (will be sent to tenant)
            </label>
            <textarea
              id="adminMessage"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter message to tenant..."
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
            ></textarea>
          </div>
        </div>
      </ConfirmDialog>
      
      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={isRejectDialogOpen}
        onClose={() => {
          setIsRejectDialogOpen(false);
          setAdminMessage('');
        }}
        title={
          requestType === 'transfer'
            ? 'Reject Room Transfer Request'
            : requestType === 'moveout'
            ? 'Reject Move Out Request'
            : 'Reject Room Request'
        }
        onConfirm={handleReject}
        confirmButtonText="Reject"
        confirmButtonColor="red"
        isProcessing={submitting}
      >
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Are you sure you want to reject this request? The tenant will be notified of your decision.
          </p>
          
          <div className="mt-4">
            <label htmlFor="adminMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rejection (will be sent to tenant)
            </label>
            <textarea
              id="adminMessage"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why you're rejecting this request..."
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              required
            ></textarea>
          </div>
        </div>
      </ConfirmDialog>
    </AdminLayout>
  );
};

export default RoomRequestDetail;