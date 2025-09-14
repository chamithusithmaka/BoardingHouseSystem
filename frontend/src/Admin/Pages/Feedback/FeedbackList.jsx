import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaComment, FaSearch, FaFilter, FaSpinner, 
  FaEnvelope, FaCheckCircle, FaArchive, FaExclamationTriangle, 
  FaTrash, FaSortAmountDown, FaSortAmountUp, FaChartBar
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const FeedbackList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    newCount: 0,
    respondedCount: 0,
    archivedCount: 0
  });
  
  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    propertyId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState({
    field: 'createdAt',
    direction: 'desc'
  });
  
  // Properties list for filter
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchFeedback();
    fetchStats();
    fetchProperties();
  }, [page, filters, sort]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string with filters and sorting
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        sortBy: sort.field,
        sortOrder: sort.direction
      });
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.propertyId) queryParams.append('propertyId', filters.propertyId);
      if (searchTerm) queryParams.append('search', searchTerm);
      
      const response = await axios.get(`${API_URL}/feedback?${queryParams.toString()}`);
      
      setFeedback(response.data.data.feedback);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err.response?.data?.message || 'Failed to load feedback data');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/feedback/stats`);
      setStats(response.data.data.stats);
    } catch (err) {
      console.error('Error fetching feedback stats:', err);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get(`${API_URL}/properties`);
      setProperties(response.data.data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
    }
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({
      ...prev,
      status
    }));
    setPage(1);
  };

  const handlePropertyChange = (e) => {
    setFilters(prev => ({
      ...prev,
      propertyId: e.target.value
    }));
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFeedback();
  };

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleArchive = async (id) => {
    try {
      await axios.put(`${API_URL}/feedback/${id}`, {
        status: 'archived'
      });
      
      fetchFeedback();
      fetchStats();
    } catch (err) {
      console.error('Error archiving feedback:', err);
      alert('Failed to archive feedback');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/feedback/${id}`);
      
      fetchFeedback();
      fetchStats();
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded-full text-xs flex items-center">
            <FaExclamationTriangle className="mr-1" /> New
          </span>
        );
      case 'responded':
        return (
          <span className="bg-green-900 text-green-300 px-2 py-1 rounded-full text-xs flex items-center">
            <FaCheckCircle className="mr-1" /> Responded
          </span>
        );
      case 'archived':
        return (
          <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs flex items-center">
            <FaArchive className="mr-1" /> Archived
          </span>
        );
      default:
        return (
          <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FaComment className="mr-3 text-amber-500" />
          Tenant Feedback Management
        </h1>
        
        <Link to="/admin/feedback/statistics" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center">
          <FaChartBar className="mr-2" />
          Feedback Statistics
        </Link>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 flex items-center">
          <div className="bg-gray-700 p-3 rounded-full mr-4">
            <FaComment className="text-amber-500 text-xl" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Feedback</p>
            <p className="text-white text-2xl font-bold">{stats.totalCount}</p>
          </div>
        </div>
        
        <div className="bg-blue-900/50 rounded-lg p-4 flex items-center">
          <div className="bg-blue-800/50 p-3 rounded-full mr-4">
            <FaExclamationTriangle className="text-blue-400 text-xl" />
          </div>
          <div>
            <p className="text-blue-300 text-sm">New</p>
            <p className="text-white text-2xl font-bold">{stats.newCount}</p>
          </div>
        </div>
        
        <div className="bg-green-900/50 rounded-lg p-4 flex items-center">
          <div className="bg-green-800/50 p-3 rounded-full mr-4">
            <FaEnvelope className="text-green-400 text-xl" />
          </div>
          <div>
            <p className="text-green-300 text-sm">Responded</p>
            <p className="text-white text-2xl font-bold">{stats.respondedCount}</p>
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4 flex items-center">
          <div className="bg-gray-600 p-3 rounded-full mr-4">
            <FaArchive className="text-gray-400 text-xl" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Archived</p>
            <p className="text-white text-2xl font-bold">{stats.archivedCount}</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex flex-col flex-1">
            <label className="text-sm text-gray-400 mb-1">Filter by Status</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusChange('')}
                className={`px-3 py-1 rounded-md text-sm ${filters.status === '' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusChange('new')}
                className={`px-3 py-1 rounded-md text-sm ${filters.status === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                New
              </button>
              <button
                onClick={() => handleStatusChange('responded')}
                className={`px-3 py-1 rounded-md text-sm ${filters.status === 'responded' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Responded
              </button>
              <button
                onClick={() => handleStatusChange('archived')}
                className={`px-3 py-1 rounded-md text-sm ${filters.status === 'archived' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Archived
              </button>
            </div>
          </div>
          
          {/* Property Filter */}
          <div className="w-full lg:w-56">
            <label className="text-sm text-gray-400 mb-1">Property</label>
            <select
              value={filters.propertyId}
              onChange={handlePropertyChange}
              className="w-full bg-gray-700 border border-gray-600 rounded py-2 px-3 text-white"
            >
              <option value="">All Properties</option>
              {properties.map(property => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div className="flex-1">
            <label className="text-sm text-gray-400 mb-1">Search</label>
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tenant name..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-l py-2 px-3 text-white"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-r flex items-center"
              >
                <FaSearch />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Feedback Table */}
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <FaSpinner className="text-amber-500 text-3xl animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-6 text-center">
            <FaComment className="text-gray-500 text-4xl mx-auto mb-4" />
            <p className="text-gray-400">No feedback found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('userName')}
                      className="flex items-center focus:outline-none"
                    >
                      Tenant
                      {sort.field === 'userName' && (
                        sort.direction === 'desc' ? 
                          <FaSortAmountDown className="ml-1 text-amber-500" /> : 
                          <FaSortAmountUp className="ml-1 text-amber-500" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Comments</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center focus:outline-none"
                    >
                      Date
                      {sort.field === 'createdAt' && (
                        sort.direction === 'desc' ? 
                          <FaSortAmountDown className="ml-1 text-amber-500" /> : 
                          <FaSortAmountUp className="ml-1 text-amber-500" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {feedback.map(item => (
                  <tr key={item._id} className="hover:bg-gray-750">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-white">{item.userName}</div>
                      <div className="text-xs text-gray-400">ID: {item.userId.substring(0, 8)}...</div>
                      <div className="text-xs text-gray-400">Email: {item.userEmail || 'Not provided'}</div>
                      <div className="text-xs text-gray-400">Room: {item.roomId?.roomNumber || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-300">
                        {item.comments.length > 100 
                          ? `${item.comments.substring(0, 100)}...` 
                          : item.comments}
                      </div>
                      {item.adminResponse && (
                        <div className="mt-1 text-xs text-green-400 italic">
                          Admin response: {item.adminResponse.message.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/feedback/${item._id}`}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 rounded mr-2 inline-flex items-center"
                      >
                        <FaEnvelope className="mr-1" /> Respond
                      </Link>
                      
                      {item.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(item._id)}
                          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded mr-2 inline-flex items-center"
                        >
                          <FaArchive className="mr-1" /> Archive
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="bg-red-800 hover:bg-red-700 text-white text-xs px-3 py-1 rounded inline-flex items-center"
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-700">
            <div className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </div>
            <div>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md bg-gray-700 text-gray-300 disabled:bg-gray-900 disabled:text-gray-600 mr-2"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-md bg-gray-700 text-gray-300 disabled:bg-gray-900 disabled:text-gray-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackList;