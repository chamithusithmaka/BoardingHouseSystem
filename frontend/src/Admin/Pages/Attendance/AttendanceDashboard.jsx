import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaClock, FaCalendarAlt, FaUserClock, FaUserCheck, 
  FaUserTimes, FaExclamationTriangle, FaSearch, 
  FaSpinner, FaEye, FaCog, FaChartBar, FaDownload, FaUser
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const AttendanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Fetch attendance summary
  useEffect(() => {
    const fetchAttendanceSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching attendance data for date range: ${dateRange.startDate} to ${dateRange.endDate}`);
        
        // Fetch attendance summary for date range
        const response = await axios.get(
          `${API_URL}/attendance/summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        );
        
        console.log('Attendance summary response:', response.data);
        
        // Initialize with empty array if summary is null/undefined
        const summaryData = response.data.data.summary || [];
        
        // Create display-ready summary objects
        const displaySummary = summaryData.map(item => {
          // Create a tenant ID display format (first 6 characters)
          const displayId = item.tenantId.substring(0, 6);
          
          return {
            ...item,
            tenantName: `Tenant ${displayId}`,
            tenantEmail: `${displayId}@example.com`,
            tenantPhoto: null,
            // Ensure these values are numbers
            totalDays: Number(item.totalDays || 0),
            presentDays: Number(item.presentDays || 0),
            absentDays: Number(item.absentDays || 0),
            exceededDays: Number(item.exceededDays || 0),
            totalHours: Number(item.totalHours || 0),
            totalExceededHours: Number(item.totalExceededHours || 0)
          };
        });
        
        setSummary(displaySummary);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendance summary:', err);
        setError(err.response?.data?.message || 'Failed to load attendance summary. Please try again later.');
        setSummary([]); // Set to empty array on error
        setLoading(false);
      }
    };
    
    fetchAttendanceSummary();
  }, [dateRange]);
  
  // Filter summary based on search term
  const filteredSummary = summary.filter(item => 
    (item.tenantName && item.tenantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.tenantId && item.tenantId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Calculate total statistics
  const stats = {
    totalTenants: filteredSummary.length,
    totalPresent: filteredSummary.reduce((sum, item) => sum + (item.presentDays || 0), 0),
    totalAbsent: filteredSummary.reduce((sum, item) => sum + (item.absentDays || 0), 0),
    totalExceeded: filteredSummary.reduce((sum, item) => sum + (item.exceededDays || 0), 0),
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Handle date range changes with validation
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    // When changing start date, ensure end date is not before it
    if (name === 'startDate' && value > dateRange.endDate) {
      setDateRange({
        startDate: value,
        endDate: value // Set end date equal to start date if it would be invalid
      });
      return;
    }
    
    // When changing end date, ensure it's not before start date
    if (name === 'endDate' && value < dateRange.startDate) {
      // Don't allow invalid selection
      return;
    }
    
    // Otherwise, update normally
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Export attendance data to CSV
  const exportToCSV = () => {
    if (!filteredSummary.length) return;
    
    // Create CSV header row
    const headers = [
      'Tenant ID', 'Total Days', 
      'Present Days', 'Absent Days', 'Exceeded Days',
      'Total Hours', 'Exceeded Hours'
    ];
    
    // Create CSV data rows
    const rows = filteredSummary.map(item => [
      item.tenantId,
      item.totalDays,
      item.presentDays,
      item.absentDays,
      item.exceededDays,
      item.totalHours.toFixed(1),
      item.totalExceededHours
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a download link and trigger it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simple Avatar component
  const TenantAvatar = ({ name, size = "sm" }) => {
    const getInitials = (name) => {
      if (!name) return "?";
      return name.charAt(0).toUpperCase();
    };
    
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-12 h-12 text-sm",
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold`}>
        {name ? getInitials(name) : <FaUser />}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        <FaClock className="inline mr-3 text-amber-500" />
        Tenant Attendance Dashboard
      </h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
        </div>
        
        <Link 
          to="/admin/attendance/settings"
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <FaCog className="mr-2" /> 
          Utility Settings
        </Link>
      </div>
      
      {/* Date Range Selector */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center">
            <FaCalendarAlt className="text-amber-500 mr-2" />
            <span className="text-gray-300 mr-3">Date Range:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                // Optional: set max to prevent selecting future dates
                max={new Date().toISOString().split('T')[0]} 
                className="bg-gray-700 border border-gray-600 rounded p-2 text-white"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                min={dateRange.startDate} // This prevents selecting dates before start date
                // Optional: set max to prevent selecting future dates
                max={new Date().toISOString().split('T')[0]}
                className="bg-gray-700 border border-gray-600 rounded p-2 text-white"
              />
            </div>
          </div>
          
          <button
            onClick={exportToCSV}
            disabled={!filteredSummary.length}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload className="mr-2" /> Export CSV
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-900 rounded-lg p-4 flex items-center">
          <div className="bg-blue-800 p-3 rounded-full mr-4">
            <FaUserClock className="text-blue-300 text-xl" />
          </div>
          <div>
            <p className="text-blue-300 text-sm">Total Tenants</p>
            <p className="text-white text-2xl font-bold">{stats.totalTenants}</p>
          </div>
        </div>
        
        <div className="bg-green-900 rounded-lg p-4 flex items-center">
          <div className="bg-green-800 p-3 rounded-full mr-4">
            <FaUserCheck className="text-green-300 text-xl" />
          </div>
          <div>
            <p className="text-green-300 text-sm">Present Days</p>
            <p className="text-white text-2xl font-bold">{stats.totalPresent}</p>
          </div>
        </div>
        
        <div className="bg-red-900 rounded-lg p-4 flex items-center">
          <div className="bg-red-800 p-3 rounded-full mr-4">
            <FaUserTimes className="text-red-300 text-xl" />
          </div>
          <div>
            <p className="text-red-300 text-sm">Absent Days</p>
            <p className="text-white text-2xl font-bold">{stats.totalAbsent}</p>
          </div>
        </div>
        
        <div className="bg-yellow-900 rounded-lg p-4 flex items-center">
          <div className="bg-yellow-800 p-3 rounded-full mr-4">
            <FaExclamationTriangle className="text-yellow-300 text-xl" />
          </div>
          <div>
            <p className="text-yellow-300 text-sm">Exceeded Days</p>
            <p className="text-white text-2xl font-bold">{stats.totalExceeded}</p>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-700 text-white w-full pl-10 pr-4 py-2 rounded-lg border border-gray-600"
            placeholder="Search by tenant ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Attendance Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <FaSpinner className="text-amber-500 text-3xl animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 p-8 text-center">
            {error}
          </div>
        ) : filteredSummary.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tenant ID</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Present Days</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Absent Days</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Exceeded Days</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Total Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Extra Hours</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredSummary.map((item, index) => (
                  <tr key={item.tenantId} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <TenantAvatar name={`Tenant ${item.tenantId?.substring(0, 1)}`} size="sm" />
                        <div className="ml-3">
                          <div className="font-medium text-white">{item.tenantId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-400 font-medium">{item.presentDays}</span>
                      <span className="text-gray-400 text-xs"> / {item.totalDays}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-red-400 font-medium">{item.absentDays}</span>
                      <span className="text-gray-400 text-xs"> / {item.totalDays}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        item.exceededDays > 0 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {item.exceededDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-400 font-medium">
                      {item.totalHours.toFixed(1)} hrs
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        item.totalExceededHours > 0 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {item.totalExceededHours} hrs
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/attendance/${item.tenantId}`}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-3 py-1 rounded inline-flex items-center"
                      >
                        <FaEye className="mr-1" /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-400 p-8 text-center">
            No attendance records found for the selected date range.
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboard;