import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaEnvelope, FaMoneyBillWave, FaSpinner, 
  FaCheckCircle, FaExclamationTriangle, FaTimes 
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const FinanceAlertForm = ({ tenant, record, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    recipientEmail: 'finance@boardinghouse.com', // Default finance email
    ccEmail: '',
    additionalNote: '',
    includeHistory: true
  });
  
  // Calculate extra charges based on exceeded hours
  const calculateExtraCharge = () => {
    if (!record) return 0;
    // Use the exceededHours or default to 0 if not present
    const exceededHours = record.exceededHours || 0;
    const hourlyRate = 20; // Default rate if not provided in record
    return exceededHours * (record.extraHourlyRate || hourlyRate);
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tenant || !record) {
      setError('Missing tenant or attendance record data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare alert data
      const alertData = {
        tenantId: tenant._id,
        tenantName: tenant.name,
        tenantEmail: tenant.email,
        roomId: tenant.room?._id || 'unknown',
        roomNumber: tenant.room?.roomNumber || tenant.room?.roomId || 'unknown',
        attendanceId: record._id,
        date: record.date,
        exceededHours: record.exceededHours || 0,
        extraCharge: calculateExtraCharge(),
        recipientEmail: formData.recipientEmail,
        ccEmail: formData.ccEmail || undefined,
        additionalNote: formData.additionalNote,
        includeHistory: formData.includeHistory
      };
      
      // Send finance alert using the backend endpoint that calls EmailService
      const response = await axios.post(`${API_URL}/attendance/finance-alert`, alertData);
      
      console.log('Finance alert sent:', response.data);
      setSuccess(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        if (onClose) onClose();
      }, 3000);
      
    } catch (err) {
      console.error('Error sending finance alert:', err);
      setError(err.response?.data?.message || 'Failed to send finance alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // If tenant or record is missing
  if (!tenant || !record) {
    return (
      <div className="p-6 text-center">
        <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
        <p className="text-red-400">Missing required data to send finance alert.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-800 rounded-lg p-5 shadow-lg">
      {success ? (
        <div className="text-center py-6">
          <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h4 className="text-xl font-medium text-white mb-2">Alert Sent Successfully!</h4>
          <p className="text-gray-400">
            The finance department has been notified about the exceeded hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Alert Summary */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <h4 className="text-amber-400 font-medium mb-2">Alert Summary</h4>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Tenant:</div>
                <div className="text-white">{tenant.name}</div>
                
                <div className="text-gray-400">Room:</div>
                <div className="text-white">{tenant.room?.roomNumber || 'N/A'}</div>
                
                <div className="text-gray-400">Date:</div>
                <div className="text-white">
                  {new Date(record.date).toLocaleDateString()}
                </div>
                
                <div className="text-gray-400">Exceeded Hours:</div>
                <div className={record.exceededHours > 0 ? "text-amber-400 font-medium" : "text-gray-400"}>
                  {record.exceededHours > 0 ? `${record.exceededHours} hours` : 'None'}
                </div>
                
                <div className="text-gray-400">Extra Charge:</div>
                <div className={record.exceededHours > 0 ? "text-green-400 font-medium" : "text-gray-400"}>
                  {record.exceededHours > 0 ? `₱${calculateExtraCharge().toFixed(2)}` : 'None'}
                </div>
                
                <div className="text-gray-400">Status:</div>
                <div className="text-white">
                  {record.status === 'checked-in' ? 'Checked In' : 
                   record.status === 'checked-out' ? 'Checked Out' : 
                   record.status === 'absent' ? 'Absent' : 'Unknown'}
                </div>
              </div>
            </div>
            
            {/* Recipient Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Finance Email
              </label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            
            {/* CC Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                CC Email (Optional)
              </label>
              <input
                type="email"
                name="ccEmail"
                value={formData.ccEmail}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            
            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Additional Notes
              </label>
              <textarea
                name="additionalNote"
                value={formData.additionalNote}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="Any additional information..."
              />
            </div>
            
            {/* Include Attendance History */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeHistory"
                name="includeHistory"
                checked={formData.includeHistory}
                onChange={handleChange}
                className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-600 rounded"
              />
              <label htmlFor="includeHistory" className="ml-2 block text-sm text-gray-400">
                Include attendance history for the past 30 days
              </label>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors focus:outline-none"
              >
                {loading ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaEnvelope className="mr-2" />
                )}
                Send Alert
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  // Close modal with escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md md:max-w-lg relative z-10 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FinanceAlertForm;