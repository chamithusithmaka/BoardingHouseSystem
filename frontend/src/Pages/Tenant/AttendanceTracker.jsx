import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaClock, 
  FaSignInAlt, 
  FaSignOutAlt, 
  FaCalendarCheck, 
  FaCalendarTimes,
  FaExclamationTriangle,
  FaSpinner,
  FaCheckCircle,
  FaHistory,
  FaExclamationCircle,
  FaBell,
  FaDollarSign,
  FaComment
} from 'react-icons/fa';
import FeedbackForm from '../../Components/Feedback/FeedbackForm';
import Modal from '../../Components/Common/Modal';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const AttendanceTracker = ({ user, room, tenant, utilitySettings }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastAbsentCheck, setLastAbsentCheck] = useState(null); // <-- New state for tracking last absent check time
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  // Format time function
  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format duration function
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
    } else if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hr ${remainingMinutes} min`;
    }
  };

  // Get attendance status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'checked-in':
        return {
          icon: <FaSignInAlt className="text-blue-400 mr-2" />,
          text: 'Checked In',
          textColor: 'text-blue-400'
        };
      case 'checked-out':
        return {
          icon: <FaSignOutAlt className="text-green-400 mr-2" />,
          text: 'Checked Out',
          textColor: 'text-green-400'
        };
      case 'absent':
        return {
          icon: <FaCalendarTimes className="text-red-400 mr-2" />,
          text: 'Absent',
          textColor: 'text-red-400'
        };
      case 'exceeded-limit':
        return {
          icon: <FaExclamationTriangle className="text-yellow-400 mr-2" />,
          text: 'Exceeded Limit',
          textColor: 'text-yellow-400'
        };
      default:
        return {
          icon: <FaCalendarCheck className="text-gray-400 mr-2" />,
          text: 'Unknown',
          textColor: 'text-gray-400'
        };
    }
  };

  // Fetch today's attendance
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!user?.id || !room?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching attendance for tenant: ${user.id}`);
        
        const response = await axios.get(`${API_URL}/attendance/today/${user.id}`);
        setTodayAttendance(response.data.data.attendance);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data. Please try again later.');
        setLoading(false);
      }
    };

    fetchTodayAttendance();
    
    // Refresh every minute when checked in but not checked out
    const interval = setInterval(() => {
      if (todayAttendance?.status === 'checked-in') {
        fetchTodayAttendance();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user?.id, room?._id]);

  // Handle check-in
  const handleCheckIn = async () => {
    if (!user?.id || !room?._id) {
      alert('User or room information is missing');
      return;
    }

    try {
      setCheckingIn(true);
      console.log(`Checking in tenant ${user.id} for room ${room._id}`);
      
      const response = await axios.post(`${API_URL}/attendance/check-in`, {
        tenantId: user.id,
        roomId: room._id
      });

      setTodayAttendance(response.data.data.attendance);
      setCheckingIn(false);
    } catch (err) {
      console.error('Check-in error:', err);
      alert(err.response?.data?.message || 'Failed to check in. Please try again.');
      setCheckingIn(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!user?.id) {
      alert('User information is missing');
      return;
    }

    try {
      setCheckingOut(true);
      const response = await axios.post(`${API_URL}/attendance/check-out`, {
        tenantId: user.id
      });

      setTodayAttendance(response.data.data.attendance);
      
      // Show warning if tenant exceeded allowed hours
      if (response.data.data.exceededHours > 0) {
        const extraCharge = response.data.data.extraCharge;
        alert(`You have exceeded the allotted usage hours by ${response.data.data.exceededHours} hours. Extra charges of LKR:${extraCharge} may apply.`);
      }
      
      setCheckingOut(false);
    } catch (err) {
      console.error('Check-out error:', err);
      alert(err.response?.data?.message || 'Failed to check out. Please try again.');
      setCheckingOut(false);
    }
  };

  // Toggle attendance history
  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    
    if (!attendanceHistory.length) {
      try {
        setLoadingHistory(true);
        
        // Get last 7 days of attendance
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const response = await axios.get(
          `${API_URL}/attendance/history/${user.id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        setAttendanceHistory(response.data.data.attendance);
        setLoadingHistory(false);
        setShowHistory(true);
      } catch (err) {
        console.error('Error fetching attendance history:', err);
        alert('Failed to load attendance history');
        setLoadingHistory(false);
      }
    } else {
      setShowHistory(true);
    }
  };

  // Calculate current duration for ongoing check-in
  const getCurrentDuration = () => {
    if (!todayAttendance || !todayAttendance.checkInTime || todayAttendance.status !== 'checked-in') {
      return null;
    }
    
    const checkInTime = new Date(todayAttendance.checkInTime);
    const now = new Date();
    const durationMinutes = Math.round((now - checkInTime) / (1000 * 60));
    
    return formatDuration(durationMinutes);
  };

  // Check if utility limits are being approached
  const getUtilityWarning = () => {
    if (!todayAttendance || !todayAttendance.checkInTime || todayAttendance.status !== 'checked-in' || !utilitySettings) {
      return null;
    }
    
    const checkInTime = new Date(todayAttendance.checkInTime);
    const now = new Date();
    const durationMinutes = Math.round((now - checkInTime) / (1000 * 60));
    
    // Use the utility settings from props
    const allowedMinutes = utilitySettings.allowedDailyHours * 60;
    
    // If over 80% of allowed time
    if (durationMinutes >= allowedMinutes * 0.8) {
      const remainingMinutes = allowedMinutes - durationMinutes;
      
      if (remainingMinutes <= 0) {
        return {
          type: 'exceeded',
          message: `You have exceeded the daily utility limit of ${utilitySettings.allowedDailyHours} hours`
        };
      } else {
        return {
          type: 'warning',
          message: `${formatDuration(remainingMinutes)} remaining until utility limit`
        };
      }
    }
    
    return null;
  };

  const utilityWarning = getUtilityWarning();

  // Add this function at the appropriate place in your AttendanceTracker component
  const testAbsentMarking = async () => {
    try {
      // Include the user ID in the request URL
      const response = await axios.post(`${API_URL}/attendance/mark-absent-test/${user.id}`);
      
      // Set the timestamp of when this check was run
      setLastAbsentCheck(new Date());
      
      alert(`Test completed: ${response.data.message}`);
      
      // Refresh attendance data to see changes
      const attendanceResponse = await axios.get(`${API_URL}/attendance/today/${user.id}`);
      setTodayAttendance(attendanceResponse.data.data.attendance);
      
      // Refresh history if it's open
      if (showHistory) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const historyResponse = await axios.get(
          `${API_URL}/attendance/history/${user.id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        setAttendanceHistory(historyResponse.data.data.attendance);
      }
    } catch (error) {
      console.error('Error testing absent marking:', error);
      alert(`Error: ${error.response?.data?.message || 'Unknown error occurred'}`);
    }
  };

  // Check for existing feedback and open the form
  const handleOpenFeedback = async () => {
    try {
      // Check if user already has feedback for today
      const response = await axios.get(`${API_URL}/feedback/user/${user.id}/recent`);
      if (response.data.data.feedback) {
        setExistingFeedback(response.data.data.feedback);
      } else {
        setExistingFeedback(null);
      }
      setShowFeedbackForm(true);
    } catch (err) {
      console.error('Error checking existing feedback:', err);
      setExistingFeedback(null);
      setShowFeedbackForm(true);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FaClock className="text-amber-500 mr-2" /> 
          Daily Attendance
        </h3>
        <button
          onClick={toggleHistory}
          className="text-sm flex items-center text-gray-400 hover:text-white"
          disabled={loadingHistory}
        >
          {loadingHistory ? (
            <FaSpinner className="animate-spin mr-1" />
          ) : (
            <FaHistory className="mr-1" />
          )}
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <FaSpinner className="animate-spin text-amber-500 text-2xl" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border-l-4 border-red-500 text-red-400 p-4 rounded">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            {todayAttendance ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    {getStatusDisplay(todayAttendance.status).icon}
                    <span className={`font-medium ${getStatusDisplay(todayAttendance.status).textColor}`}>
                      {getStatusDisplay(todayAttendance.status).text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(todayAttendance.date)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-xs text-gray-400 mb-1">Check-in Time</div>
                    <div className="font-medium">
                      {formatTime(todayAttendance.checkInTime)}
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <div className="text-xs text-gray-400 mb-1">Check-out Time</div>
                    <div className="font-medium">
                      {todayAttendance.checkOutTime ? formatTime(todayAttendance.checkOutTime) : '--:--'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-3 rounded-md mb-4">
                  <div className="text-xs text-gray-400 mb-1">Duration</div>
                  <div className="font-medium">
                    {todayAttendance.status === 'checked-in' ? getCurrentDuration() : formatDuration(todayAttendance.duration)}
                  </div>
                </div>

                {utilityWarning && (
                  <div className={`p-3 rounded-md mb-4 flex items-start
                    ${utilityWarning.type === 'warning' ? 'bg-yellow-900/30 border-l-4 border-yellow-500' : 'bg-red-900/30 border-l-4 border-red-500'}`}>
                    <FaBell className={`flex-shrink-0 mt-1 mr-2 ${utilityWarning.type === 'warning' ? 'text-yellow-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${utilityWarning.type === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {utilityWarning.message}
                    </span>
                  </div>
                )}

                <div className="flex justify-between mt-2">
                  {todayAttendance.status === 'checked-in' ? (
                    <button
                      onClick={handleCheckOut}
                      disabled={checkingOut}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md flex items-center justify-center"
                    >
                      {checkingOut ? (
                        <FaSpinner className="animate-spin mr-2" />
                      ) : (
                        <FaSignOutAlt className="mr-2" />
                      )}
                      Check Out
                    </button>
                  ) : (
                    todayAttendance.status === 'absent' || todayAttendance.status === 'checked-out' || todayAttendance.status === 'exceeded-limit' ? (
                      <div className="w-full bg-gray-700 py-3 rounded-md text-gray-400 text-center text-sm">
                        <FaCheckCircle className="inline mr-2" />
                        Attendance recorded for today
                      </div>
                    ) : (
                      <div className="w-full bg-gray-700 py-3 rounded-md text-gray-400 text-center text-sm">
                        <FaExclamationCircle className="inline mr-2" />
                        Unable to determine attendance status
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-4">
                  <FaCalendarCheck className="text-amber-500 text-2xl mx-auto mb-2" />
                  <p className="text-gray-300 mb-2">You haven't checked in today</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Check-in to record your daily attendance
                  </p>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md flex items-center justify-center"
                >
                  {checkingIn ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaSignInAlt className="mr-2" />
                  )}
                  Check In Now
                </button>
              </div>
            )}
          </div>

          {/* Utility Settings Information */}
          {utilitySettings && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Utility Settings</h3>
              <div className="bg-gray-700 p-3 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm">
                    <FaClock className="text-amber-500 mr-2" />
                    <span className="text-gray-300">Daily Limit:</span>
                  </div>
                  <span className="font-medium text-white">{utilitySettings.allowedDailyHours} hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <FaDollarSign className="text-amber-500 mr-2" />
                    <span className="text-gray-300">Extra Rate:</span>
                  </div>
                  <span className="font-medium text-white">LKR:{utilitySettings.extraHourlyRate}/hour</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Attendance History */}
          {showHistory && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium mb-3">Recent Attendance History</h4>
              
              {attendanceHistory.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {attendanceHistory.map(record => (
                    <div key={record._id} className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                      <div className="flex items-center">
                        {getStatusDisplay(record.status).icon}
                        <div>
                          <div className="text-sm">{formatDate(record.date)}</div>
                          <div className="text-xs text-gray-400">
                            {record.status !== 'absent' ? (
                              <span>Duration: {formatDuration(record.duration)}</span>
                            ) : (
                              <span>No check-in recorded</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-right">
                        {record.exceededHours > 0 && (
                          <div className="text-yellow-400">
                            +{record.exceededHours} hr excess
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  No attendance records found
                </div>
              )}
            </div>
          )}

          {/* Developer Testing - Only visible in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium mb-2">Developer Testing</h4>
              <button
                onClick={testAbsentMarking}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md flex items-center justify-center"
              >
                <FaExclamationTriangle className="mr-2" />
                Test Absent Marking (24-hour)
              </button>
              {lastAbsentCheck && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                  Last absent check run: {lastAbsentCheck.toLocaleTimeString()}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2 text-center">
                This will mark tenants who haven't checked in during the past 24 hours as absent
              </div>
            </div>
          )}

          {/* Feedback Button */}
          <div className="mt-4 border-t border-gray-700 pt-4">
            <button
              onClick={handleOpenFeedback}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md flex items-center justify-center"
            >
              <FaComment className="mr-2" />
              {existingFeedback ? 'Update Your Feedback' : 'Share Your Feedback'}
            </button>
          </div>

          {/* Feedback Modal */}
          {showFeedbackForm && (
            <Modal
              isOpen={showFeedbackForm}
              onClose={() => setShowFeedbackForm(false)}
              title={existingFeedback ? 'Update Feedback' : 'Share Your Feedback'}
            >
              <FeedbackForm 
                user={user}
                room={room}
                existingFeedback={existingFeedback}
                onClose={() => setShowFeedbackForm(false)}
              />
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceTracker;