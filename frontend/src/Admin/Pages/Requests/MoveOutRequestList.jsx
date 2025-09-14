import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaSearch, FaFilter, FaSignOutAlt, FaEye,
  FaSpinner, FaExclamationTriangle, FaCalendar, 
  FaUserCircle, FaBuilding, FaCheck, FaTimes, FaClock,
  FaSortAmountUp, FaSortAmountDown, FaTrash
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MoveOutRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('requestDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [processingAction, setProcessingAction] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);

  // Fetch move-out requests
  const fetchMoveOutRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/rooms/moveout-requests`);
      
      if (response.data.status === 'success') {
        setRequests(response.data.data.requests || []);
        setFilteredRequests(response.data.data.requests || []);
      } else {
        setError('Failed to load move-out requests');
      }
    } catch (err) {
      console.error('Error fetching move-out requests:', err);
      setError('An error occurred while fetching move-out requests');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMoveOutRequests();
  }, []);

  // Apply filters and sorting when any filter changes
  useEffect(() => {
    let result = [...requests];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(request => request.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(request => {
        return (
          (request.tenantName?.toLowerCase().includes(term) || false) ||
          (request.tenantEmail?.toLowerCase().includes(term) || false) ||
          (request.roomId?.roomId?.toLowerCase().includes(term) || false) ||
          (request.roomId?.property?.name?.toLowerCase().includes(term) || false)
        );
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'requestDate':
          valueA = new Date(a.requestDate || 0);
          valueB = new Date(b.requestDate || 0);
          break;
        case 'moveOutDate':
          valueA = new Date(a.moveOutDate || 0);
          valueB = new Date(b.moveOutDate || 0);
          break;
        case 'tenantName':
          valueA = a.tenantName || '';
          valueB = b.tenantName || '';
          break;
        case 'status':
          valueA = a.status || '';
          valueB = b.status || '';
          break;
        default:
          valueA = a[sortBy];
          valueB = b[sortBy];
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredRequests(result);
  }, [requests, statusFilter, searchTerm, sortBy, sortOrder]);

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
    let icon = <FaClock />;
    
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
      case 'completed':
        bgColor = 'bg-blue-500';
        icon = <FaCheck className="mr-1" />;
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
  
  // Toggle sort order and field
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Handle approve/reject button click
  const handleActionClick = (request, action) => {
    setSelectedRequest(request);
    setSelectedAction(action);
    
    // Default message based on action
    setAdminMessage(
      action === 'approve' 
        ? `Your move-out request has been approved. Please vacate the room by ${formatDate(request.moveOutDate)}.` 
        : 'Your move-out request has been rejected.'
    );
    
    setShowConfirmDialog(true);
  };
  
  // Handle confirm action
  const handleConfirmAction = async () => {
    if (!selectedRequest || !selectedAction) return;
    
    setProcessingAction(selectedRequest._id);
    
    try {
      // First update the status
      await axios.patch(`${API_URL}/rooms/moveout-requests/${selectedRequest._id}`, {
        status: selectedAction === 'approve' ? 'approved' : 'rejected',
        adminMessage
      });
      
      // After successful update, delete the request immediately
      await axios.delete(`${API_URL}/rooms/moveout-requests/${selectedRequest._id}`);
      
      // Remove the request from the state
      setRequests(prevRequests => 
        prevRequests.filter(req => req._id !== selectedRequest._id)
      );
      
      // Show success message (you can add a toast notification library for better UX)
      alert(`Request ${selectedAction === 'approve' ? 'approved' : 'rejected'} and removed successfully.`);
      
      setShowConfirmDialog(false);
    } catch (err) {
      console.error(`Error ${selectedAction}ing move-out request:`, err);
      alert(`Failed to ${selectedAction} the request: ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setProcessingAction(null);
    }
  };
  
  // Handle delete button click
  const handleDeleteClick = (request) => {
    setRequestToDelete(request);
    setShowDeleteDialog(true);
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    
    setProcessingAction(requestToDelete._id);
    
    try {
      await axios.delete(`${API_URL}/rooms/moveout-requests/${requestToDelete._id}`);
      
      // Remove the deleted request from the state
      setRequests(prevRequests => 
        prevRequests.filter(req => req._id !== requestToDelete._id)
      );
      
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting move-out request:', err);
      alert(`Failed to delete the request: ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FaSignOutAlt className="mr-3 text-amber-500" />
          Move-Out Requests
        </h1>
        <p className="text-gray-400 mt-1">
          Manage tenant requests to move out of their rooms
        </p>
      </div>
      
      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tenant name, email, or room ID..."
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
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      {/* Requests Table */}
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
      ) : filteredRequests.length > 0 ? (
        <div className="bg-gray-900 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-gray-300 text-sm uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('tenantName')}
                      className="flex items-center font-semibold"
                    >
                      <FaUserCircle className="mr-2" />
                      Tenant
                      {sortBy === 'tenantName' && (
                        <span className="ml-1">{sortOrder === 'asc' ? <FaSortAmountUp size={14} /> : <FaSortAmountDown size={14} />}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('roomId.roomId')}
                      className="flex items-center font-semibold"
                    >
                      <FaBuilding className="mr-2" />
                      Room & Property
                      {sortBy === 'roomId.roomId' && (
                        <span className="ml-1">{sortOrder === 'asc' ? <FaSortAmountUp size={14} /> : <FaSortAmountDown size={14} />}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('requestDate')}
                      className="flex items-center font-semibold"
                    >
                      <FaCalendar className="mr-2" />
                      Request Date
                      {sortBy === 'requestDate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? <FaSortAmountUp size={14} /> : <FaSortAmountDown size={14} />}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('moveOutDate')}
                      className="flex items-center font-semibold"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Move-out Date
                      {sortBy === 'moveOutDate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? <FaSortAmountUp size={14} /> : <FaSortAmountDown size={14} />}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center font-semibold"
                    >
                      Status
                      {sortBy === 'status' && (
                        <span className="ml-1">{sortOrder === 'asc' ? <FaSortAmountUp size={14} /> : <FaSortAmountDown size={14} />}</span>
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
                        {request.tenantPhoto ? (
                          <img 
                            className="h-10 w-10 rounded-full mr-3 object-cover" 
                            src={request.tenantPhoto} 
                            alt={request.tenantName} 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-700 mr-3 flex items-center justify-center">
                            <span className="text-gray-400 text-lg">{request.tenantName?.[0] || '?'}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">{request.tenantName}</div>
                          {request.tenantEmail && (
                            <div className="text-xs text-gray-400">{request.tenantEmail}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <div className="font-medium">
                        {request.roomId?.roomId || request.roomId?.roomNumber || 'Room ID N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {request.roomId?.property?.name || 'Property N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(request.requestDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDate(request.moveOutDate)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        {/* View Details Button */}
                        <Link
                          to={`/admin/requests/moveout/${request._id}`}
                          className="p-2 bg-amber-900/30 text-amber-400 rounded hover:bg-amber-800/50 inline-flex items-center"
                          title="View Details"
                        >
                          <FaEye />
                        </Link>
                        
                        {/* For pending requests, show approve/reject buttons */}
                        {request.status === 'pending' && (
                          <>
                            {/* Approve Button */}
                            <button
                              onClick={() => handleActionClick(request, 'approve')}
                              disabled={processingAction === request._id}
                              className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-800/50 inline-flex items-center"
                              title="Approve Request"
                            >
                              <FaCheck />
                            </button>
                            
                            {/* Reject Button */}
                            <button
                              onClick={() => handleActionClick(request, 'reject')}
                              disabled={processingAction === request._id}
                              className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-800/50 inline-flex items-center"
                              title="Reject Request"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        
                        {/* For approved or rejected requests, show delete button */}
                        {(request.status === 'approved' || request.status === 'rejected') && (
                          <button
                            onClick={() => handleDeleteClick(request)}
                            disabled={processingAction === request._id}
                            className="p-2 bg-gray-900/50 text-gray-400 rounded hover:bg-gray-800 inline-flex items-center"
                            title="Delete Request"
                          >
                            <FaTrash />
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
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <FaSignOutAlt className="mx-auto text-5xl text-gray-600 mb-3" />
          <p className="text-lg text-gray-300">No move-out requests found</p>
          <p className="text-sm mt-2 text-gray-400">
            {searchTerm || statusFilter !== 'all' ? 
              'Try adjusting your filters' : 
              'Move-out requests will appear here when tenants submit them'}
          </p>
        </div>
      )}
      
      {/* Approve/Reject Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {selectedAction === 'approve' ? 'Approve Move-Out Request' : 'Reject Move-Out Request'}
              </h3>
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Tenant:</span>
                  <span className="text-white">{selectedRequest?.tenantName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Room:</span>
                  <span className="text-white">
                    {selectedRequest?.roomId?.roomId || selectedRequest?.roomId?.roomNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Move-out Date:</span>
                  <span className="text-white">{formatDate(selectedRequest?.moveOutDate)}</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Message to Tenant:</label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="bg-gray-900 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processingAction}
                className={`px-4 py-2 ${
                  selectedAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } text-white rounded-lg flex items-center`}
              >
                {processingAction ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedAction === 'approve' ? <FaCheck className="mr-2" /> : <FaTimes className="mr-2" />}
                    {selectedAction === 'approve' ? 'Approve' : 'Reject'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Delete Move-Out Request
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this move-out request? This action cannot be undone.
              </p>
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Tenant:</span>
                  <span className="text-white">{requestToDelete?.tenantName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Room:</span>
                  <span className="text-white">
                    {requestToDelete?.roomId?.roomId || requestToDelete?.roomId?.roomNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white">
                    {requestToDelete?.status.charAt(0).toUpperCase() + requestToDelete?.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={processingAction}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
              >
                {processingAction ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoveOutRequestList;