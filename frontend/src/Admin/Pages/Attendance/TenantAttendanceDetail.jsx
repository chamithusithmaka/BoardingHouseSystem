import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaClock, FaUser, FaArrowLeft, FaSpinner, 
  FaCalendarDay, FaSignInAlt, FaSignOutAlt,
  FaCalendarCheck, FaCalendarTimes, FaExclamationTriangle,
  FaFilter, FaChartBar, FaMoneyBillWave
} from 'react-icons/fa';
import TenantAvatar from '../../../Components/Common/TenantAvatar';
import FinanceAlertForm from '../../Components/FinanceAlert/FinanceAlertForm';
import Modal from '../../../Components/Common/Modal';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const TenantAttendanceDetail = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    exceededDays: 0,
    averageDuration: 0,
    totalExceededHours: 0
  });
  const [showFinanceAlert, setShowFinanceAlert] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Fetch tenant details and attendance
  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        setLoading(true);
        
        // Instead of fetching tenant details directly, get room information
        // which should contain tenant data in the occupants array
        const roomsResponse = await axios.get(`${API_URL}/rooms`);
        
        // Find the room where the tenant with this ID exists
        let tenant = null;
        let room = null;
        
        if (roomsResponse.data.data && roomsResponse.data.data.rooms) {
          for (const r of roomsResponse.data.data.rooms) {
            if (r.occupants && Array.isArray(r.occupants)) {
              const foundTenant = r.occupants.find(occ => occ._id === tenantId);
              if (foundTenant) {
                tenant = foundTenant;
                room = r;
                tenant.room = room; // Add room info to tenant
                break;
              }
            }
          }
        }
        
        // If tenant not found in rooms, create a basic tenant object with available ID
        if (!tenant) {
          tenant = {
            _id: tenantId,
            name: `Tenant ${tenantId}`,
            email: `${tenantId}@example.com`,
            room: null
          };
          
          console.warn(`Tenant ${tenantId} not found in rooms, using default data`);
        }
        
        setTenant(tenant);
        
        // Get attendance history
        await fetchAttendanceHistory();
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tenant data:', err);
        setError('Failed to load tenant data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchTenantData();
  }, [tenantId]);
  
  // Fetch attendance history based on date range
  const fetchAttendanceHistory = async () => {
    try {
      const attendanceResponse = await axios.get(
        `${API_URL}/attendance/history/${tenantId}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      
      const records = attendanceResponse.data.data.attendance;
      setAttendance(records);
      
      // Calculate statistics
      const totalDays = records.length;
      const presentDays = records.filter(r => r.status !== 'absent').length;
      const absentDays = records.filter(r => r.status === 'absent').length;
      const exceededDays = records.filter(r => r.exceededHours > 0).length;
      
      const totalDuration = records.reduce((sum, record) => sum + (record.duration || 0), 0);
      const averageDuration = presentDays ? Math.round(totalDuration / presentDays) / 60 : 0;
      
      const totalExceededHours = records.reduce((sum, record) => sum + (record.exceededHours || 0), 0);
      
      setStats({
        totalDays,
        presentDays,
        absentDays,
        exceededDays,
        averageDuration,
        totalExceededHours
      });
      
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError('Failed to load attendance history. Please try again later.');
    }
  };
  
  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply date filter
  const applyDateFilter = () => {
    fetchAttendanceHistory();
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };
  
  // Format duration in hours and minutes
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  };
  
  // Handle opening the finance alert modal
  const handleOpenFinanceAlert = (record) => {
    setSelectedRecord(record);
    setShowFinanceAlert(true);
  };

  // Handle closing the modal
  const handleCloseFinanceAlert = () => {
    setShowFinanceAlert(false);
    setSelectedRecord(null);
  };
  
  // helper to get YYYY-MM-DD in local timezone
  const toYMD = (d) => {
    const tzOffsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffsetMs).toISOString().slice(0, 10);
  };

  function DateFilter({ dateRange, setDateRange }) {
    const todayStr = useMemo(() => toYMD(new Date()), []);

    const handleDateChange = (e) => {
      const { name, value } = e.target;
      const valueClampedToToday = value > todayStr ? todayStr : value;

      if (name === "startDate") {
        const nextStart = valueClampedToToday;
        const nextEnd =
          dateRange.endDate && dateRange.endDate < nextStart
            ? nextStart
            : dateRange.endDate;

        setDateRange((prev) => ({
          ...prev,
          startDate: nextStart,
          endDate: nextEnd,
        }));
      } else if (name === "endDate") {
        const nextEnd =
          valueClampedToToday < dateRange.startDate
            ? dateRange.startDate
            : valueClampedToToday;

        setDateRange((prev) => ({
          ...prev,
          endDate: nextEnd,
        }));
      }
    };

    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        {/* <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center">
            <FaFilter className="text-amber-500 mr-2" />
            <span className="text-gray-300 mr-3">Filter by Date:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                max={todayStr}
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
                min={dateRange.startDate || undefined}
                max={todayStr}
                className="bg-gray-700 border border-gray-600 rounded p-2 text-white"
              />
            </div>
          </div>
        </div> */}
      </div>
    );
  }
  
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FaClock className="mr-3 text-amber-500" />
            Tenant Attendance Details
          </h1>
          
          <button 
            onClick={() => navigate('/admin/attendance')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <FaArrowLeft className="mr-2" /> 
            Back to Dashboard
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <FaSpinner className="text-amber-500 text-3xl animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        ) : tenant ? (
          <>
            {/* Tenant Info Card */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center sm:items-start">
                <div className="mb-4 sm:mb-0 sm:mr-6">
                  <TenantAvatar 
                    name={tenant.name} 
                    photoUrl={tenant.photo}
                    size="lg" 
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-white mb-1">{tenant.name}</h2>
                  <p className="text-gray-400 flex items-center justify-center sm:justify-start mb-3">
                    <FaUser className="mr-2" />
                    {tenant.email}
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-700/50 rounded-md p-3 text-center">
                      <div className="text-sm text-gray-400">Room</div>
                      <div className="font-medium text-white">
                        {tenant.room?.roomNumber || tenant.room?.roomId || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-md p-3 text-center">
                      <div className="text-sm text-gray-400 mb-1">Move-in Date</div>
                      <div className="font-medium text-white">
                        {tenant.moveInDate ? formatDate(tenant.moveInDate).split(',')[0] : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-md p-3 text-center">
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="font-medium text-green-400">Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Date Range Filter */}
            <DateFilter dateRange={dateRange} setDateRange={setDateRange} />
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Total Days</div>
                  <FaCalendarDay className="text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalDays}</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Present</div>
                  <FaCalendarCheck className="text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-400">{stats.presentDays}</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Absent</div>
                  <FaCalendarTimes className="text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-400">{stats.absentDays}</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Exceeded Limit</div>
                  <FaExclamationTriangle className="text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-yellow-400">{stats.exceededDays}</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Avg. Duration</div>
                  <FaChartBar className="text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-400">{stats.averageDuration.toFixed(1)} h</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Extra Hours</div>
                  <FaClock className="text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-400">{stats.totalExceededHours}</div>
              </div>
            </div>
            
            {/* Attendance Records */}
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="p-4 bg-gray-900">
                <h3 className="font-semibold text-white flex items-center">
                  <FaClock className="mr-2 text-amber-500" />
                  Attendance Records
                </h3>
              </div>
              
              {attendance.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No attendance records found for this date range.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Check-in</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Check-out</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Extra Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {attendance.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-750">
                          <td className="px-4 py-3">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              {record.status === 'checked-in' && (
                                <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-md text-xs flex items-center">
                                  <FaSignInAlt className="mr-1" /> Checked In
                                </span>
                              )}
                              {record.status === 'checked-out' && (
                                <span className="bg-green-900 text-green-200 px-2 py-1 rounded-md text-xs flex items-center">
                                  <FaSignOutAlt className="mr-1" /> Checked Out
                                </span>
                              )}
                              {record.status === 'absent' && (
                                <span className="bg-red-900 text-red-200 px-2 py-1 rounded-md text-xs flex items-center">
                                  <FaCalendarTimes className="mr-1" /> Absent
                                </span>
                              )}
                              {record.status === 'exceeded-limit' && (
                                <span className="bg-yellow-900 text-yellow-200 px-2 py-1 rounded-md text-xs flex items-center">
                                  <FaExclamationTriangle className="mr-1" /> Exceeded Limit
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {record.status === 'absent' ? 'Absent' : formatTime(record.checkInTime)}
                          </td>
                          <td className="px-4 py-3">
                            {record.status === 'absent' ? 'Absent' : 
                              record.status === 'checked-in' ? 'Still active' : 
                              formatTime(record.checkOutTime)}
                          </td>
                          <td className="px-4 py-3">
                            {record.status === 'absent' ? 'Absent' : formatDuration(record.duration)}
                          </td>
                          <td className="px-4 py-3">
                            {record.exceededHours > 0 ? (
                              <span className="text-yellow-400 font-medium">
                                {record.exceededHours} hours
                              </span>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {/* Remove the condition that checks for exceededHours > 0 */}
                            <button
                              onClick={() => handleOpenFinanceAleFVrt(record)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs flex items-center"
                            >
                              <FaMoneyBillWave className="mr-1" /> Alert Finance
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">Tenant not found</p>
          </div>
        )}
      </div>
      
      {showFinanceAlert && selectedRecord && (
        <Modal
          isOpen={showFinanceAlert}
          onClose={handleCloseFinanceAlert}
          title="Send Finance Alert"
        >
          <FinanceAlertForm
            tenant={tenant}
            record={selectedRecord}
            onClose={handleCloseFinanceAlert}
          />
        </Modal>
      )}
    </>
  );
};

export default TenantAttendanceDetail;