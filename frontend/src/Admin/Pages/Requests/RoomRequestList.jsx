import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaHome, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSpinner, 
  FaFilter, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaExclamationTriangle,
  FaUserCircle,
  FaBuilding,
  FaCalendar,
  FaTrash,
  FaExclamationCircle,
  FaClock
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const RoomRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('requestDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  // Fetch room requests
  const fetchRoomRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fix the endpoint URL to match your actual route structure
      const response = await axios.get(`${API_URL}/room-requests`);
      
      if (response.data.status === 'success') {
        // Filter out transfer requests
        const regularRequests = response.data.data.requests.filter(
          request => !request.isTransferRequest
        );
        setRequests(regularRequests || []);
      } else {
        setError('Failed to load room requests');
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching room requests:', err);
      setError('An error occurred while fetching room requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRoomRequests();
  }, []);

  // Filter and sort requests
  useEffect(() => {
    const filtered = requests.filter(request => {
      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = request.name && request.name.toLowerCase().includes(searchLower);
      const emailMatch = request.email && request.email.toLowerCase().includes(searchLower);
      const roomMatch = request.roomId && 
        ((typeof request.roomId === 'object' && 
          ((request.roomId.roomNumber?.toString() || '').includes(searchLower) || 
           (request.roomId.roomId?.toLowerCase() || '').includes(searchLower))) ||
         (typeof request.roomId === 'string' && 
          request.roomId.toLowerCase().includes(searchLower)));
      
      // Filter by status
      const statusMatch = statusFilter === 'all' || request.status === statusFilter;
      
      return statusMatch && (nameMatch || emailMatch || roomMatch);
    });
    
    // Sort filtered requests
    const sorted = [...filtered].sort((a, b) => {
      // Sort by selected field
      let aValue, bValue;
      
      // Handle nested properties
      if (sortBy === 'roomId.roomNumber') {
        aValue = typeof a.roomId === 'object' ? a.roomId?.roomNumber : null;
        bValue = typeof b.roomId === 'object' ? b.roomId?.roomNumber : null;
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }
      
      // Handle special sort cases
      if (sortBy === 'requestDate' || sortBy === 'moveInDate') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }
      
      // Handle null values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Handle direction
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredRequests(sorted);
  }, [requests, searchTerm, statusFilter, sortBy, sortDirection]);

  // Handle approve/reject actions
  const handleAction = async (requestId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this room request?`)) {
      return;
    }
    
    try {
      setProcessingAction(requestId);
      console.log(`Processing ${action} for request ID: ${requestId}`);
      
      // Message to send to tenant
      const message = action === 'approve' 
        ? 'Your room request has been approved' 
        : 'Your room request has been rejected';
      
      // Use the correct endpoint URL structure with /approve or /reject
      const endpoint = `${API_URL}/room-requests/${requestId}/${action}`;
      console.log(`Sending request to: ${endpoint}`);
      
      const response = await axios.patch(endpoint, { message });
      console.log('Server response:', response.data);
      
      // Update UI
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === requestId ? { 
            ...req, 
            status: action === 'approve' ? 'approved' : 'rejected',
            adminResponse: {
              message,
              responseDate: new Date()
            }
          } : req
        )
      );
      
      alert(`Room request ${action}d successfully`);
      setProcessingAction(null);
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      console.log('Error response:', err.response?.data);
      alert(`Failed to ${action} request: ${err.response?.data?.message || 'Please try again.'}`);
      setProcessingAction(null);
    }
  };

  // Handle delete button click
  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setShowDeleteConfirm(true);
  };
  
  // Confirm deletion of a single request
  const confirmDelete = async () => {
    if (!requestToDelete) return;
    
    setProcessingAction(requestToDelete._id);
    
    try {
      // Fix the endpoint URL for deletion
      await axios.delete(`${API_URL}/room-requests/${requestToDelete._id}`);
      
      // Update state to remove the deleted request
      setRequests(prevRequests => 
        prevRequests.filter(req => req._id !== requestToDelete._id)
      );
      
      setShowDeleteConfirm(false);
      setRequestToDelete(null);
    } catch (err) {
      console.error('Error deleting room request:', err);
      alert(`Failed to delete request: ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setProcessingAction(null);
    }
  };

  // Toggle sort direction
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-500';
    let textColor = 'text-white';
    let icon = <FaClock className="mr-1" />;
    
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-500';
        icon = <FaClock className="mr-1" />;
        break;
      case 'approved':
        bgColor = 'bg-green-500';
        icon = <FaCheck className="mr-1" />;
        break;
      case 'rejected':
        bgColor = 'bg-red-500';
        icon = <FaTimes className="mr-1" />;
        break;
      case 'cancelled':
        bgColor = 'bg-gray-500';
        icon = <FaTimes className="mr-1" />;
        break;
      default:
        break;
    }
    
    return (
      <span className={`${bgColor} ${textColor} px-3 py-1 rounded-full flex items-center gap-1 text-xs font-medium whitespace-nowrap`}>
        {icon}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  // Update your handleConfirmAction function
  const handleConfirmAction = async () => {
    if (!selectedRequest || !selectedAction) return;
    
    setProcessingAction(selectedRequest._id);
    
    try {
      // Use the correct API endpoint with the request ID
      const response = await axios.patch(
        `${API_URL}/room-requests/${selectedRequest._id}/${selectedAction === 'approve' ? 'approve' : 'reject'}`,
        { message: adminMessage }
      );
      
      console.log(`Request ${selectedAction}d successfully:`, response.data);
      
      // Update the request status in the UI
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req._id === selectedRequest._id ? 
          { 
            ...req, 
            status: selectedAction === 'approve' ? 'approved' : 'rejected',
            adminResponse: {
              message: adminMessage,
              responseDate: new Date()
            }
          } : req
        )
      );
      
      setShowConfirmDialog(false);
      // Show success message
      alert(`Request has been ${selectedAction === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (err) {
      console.error(`Error ${selectedAction}ing room request:`, err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to ${selectedAction} the request. Please try again.`);
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FaHome className="mr-3 text-amber-500" />
          Room Booking Requests
        </h1>
        <p className="text-gray-400 mt-1">
          Manage tenant requests to book rooms
        </p>
      </div>
      
      {/* Confirmation Dialog for Delete */}
      {showDeleteConfirm && requestToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center text-red-500 mb-4">
              <FaExclamationCircle className="text-3xl mr-3" />
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-white mb-4">
              Are you sure you want to delete this room request?
            </p>
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Tenant:</span>
                <span className="text-white font-medium">{requestToDelete.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Room:</span>
                <span className="text-white">
                  {typeof requestToDelete.roomId === 'object' 
                    ? (requestToDelete.roomId.roomId || `Room ${requestToDelete.roomId.roomNumber}`) 
                    : 'Unknown Room'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-white">
                  {requestToDelete.status.charAt(0).toUpperCase() + requestToDelete.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={processingAction === requestToDelete._id}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded flex items-center"
              >
                {processingAction === requestToDelete._id ? (
                  <><FaSpinner className="animate-spin mr-2" /> Deleting...</>
                ) : (
                  <><FaTrash className="mr-2" /> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog for Approve/Reject */}
      {showConfirmDialog && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedAction === 'approve' ? 'Approve' : 'Reject'} Request
              </h3>
            </div>
            <p className="text-white mb-4">
              Are you sure you want to {selectedAction} this room request?
            </p>
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Tenant:</span>
                <span className="text-white font-medium">{selectedRequest.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Room:</span>
                <span className="text-white">
                  {typeof selectedRequest.roomId === 'object' 
                    ? (selectedRequest.roomId.roomId || `Room ${selectedRequest.roomId.roomNumber}`) 
                    : 'Unknown Room'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-white">
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4 mb-4">
              <textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                placeholder="Optional message to tenant"
                className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processingAction === selectedRequest._id}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded flex items-center"
              >
                {processingAction === selectedRequest._id ? (
                  <><FaSpinner className="animate-spin mr-2" /> Processing...</>
                ) : (
                  <><FaCheck className="mr-2" /> {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tenant name, email, or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        <div className="md:w-48">
          <label className="flex items-center text-gray-300 text-sm font-medium mb-1">
            <FaFilter className="mr-1" /> Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {/* Request Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-amber-500 text-4xl" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 p-4 mb-4 rounded">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <FaHome className="mx-auto text-5xl text-gray-600 mb-3" />
          <p className="text-lg text-gray-300">No room requests found</p>
          <p className="text-sm mt-2 text-gray-400">
            {searchTerm || statusFilter !== 'all' ? 
              'Try adjusting your filters' : 
              'Room requests will appear here when tenants submit them'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-gray-300 text-sm uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => toggleSort('name')}
                      className="flex items-center font-semibold"
                    >
                      <FaUserCircle className="mr-2" />
                      Tenant
                      {sortBy === 'name' && (
                        sortDirection === 'asc' ? 
                        <FaSortAmountUp className="ml-1 text-xs" /> : 
                        <FaSortAmountDown className="ml-1 text-xs" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => toggleSort('roomId.roomNumber')}
                      className="flex items-center font-semibold"
                    >
                      <FaBuilding className="mr-2" />
                      Room
                      {sortBy === 'roomId.roomNumber' && (
                        sortDirection === 'asc' ? 
                        <FaSortAmountUp className="ml-1 text-xs" /> : 
                        <FaSortAmountDown className="ml-1 text-xs" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => toggleSort('requestDate')}
                      className="flex items-center font-semibold"
                    >
                      <FaCalendar className="mr-2" />
                      Request Date
                      {sortBy === 'requestDate' && (
                        sortDirection === 'asc' ? 
                        <FaSortAmountUp className="ml-1 text-xs" /> : 
                        <FaSortAmountDown className="ml-1 text-xs" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => toggleSort('moveInDate')}
                      className="flex items-center font-semibold"
                    >
                      <FaCalendar className="mr-2" />
                      Move-in Date
                      {sortBy === 'moveInDate' && (
                        sortDirection === 'asc' ? 
                        <FaSortAmountUp className="ml-1 text-xs" /> : 
                        <FaSortAmountDown className="ml-1 text-xs" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => toggleSort('status')}
                      className="flex items-center font-semibold"
                    >
                      Status
                      {sortBy === 'status' && (
                        sortDirection === 'asc' ? 
                        <FaSortAmountUp className="ml-1 text-xs" /> : 
                        <FaSortAmountDown className="ml-1 text-xs" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {request.photo ? (
                          <img 
                            src={request.photo} 
                            alt={request.name} 
                            className="w-8 h-8 rounded-full mr-3 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 mr-3 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">{request.name?.[0] || '?'}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">{request.name}</div>
                          {request.email && (
                            <div className="text-xs text-gray-400">{request.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {typeof request.roomId === 'object' && request.roomId ? (
                        <>
                          <div className="font-medium">
                            {request.roomId.roomId || `Room ${request.roomId.roomNumber}`}
                          </div>
                          {request.roomId.property && typeof request.roomId.property === 'object' && (
                            <div className="text-xs text-gray-400">
                              {request.roomId.property.name}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500">No room data</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(request.requestDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(request.moveInDate)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {/* View Details Button */}
                        <Link
                          to={`/admin/requests/room/${request._id}`}
                          className="p-2 bg-amber-900/30 text-amber-400 rounded hover:bg-amber-800/50"
                          title="View details"
                        >
                          <FaEye />
                        </Link>
                        
                        {/* Approve/Reject buttons only for pending requests */}
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(request._id, 'approve')}
                              className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-800/50"
                              title="Approve request"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleAction(request._id, 'reject')}
                              className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-800/50"
                              title="Reject request"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        
                        {/* Delete button only for non-pending requests */}
                        {request.status !== 'pending' && (
                          <button
                            onClick={() => handleDeleteClick(request)}
                            disabled={processingAction === request._id}
                            className="p-2 bg-gray-900/50 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            title="Delete request"
                          >
                            {processingAction === request._id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomRequestList;