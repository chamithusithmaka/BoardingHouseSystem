import { useState } from 'react';
import axios from 'axios';
import { 
  FaTimesCircle, FaDoorOpen, FaExclamationTriangle, 
  FaSpinner, FaCheckCircle, FaCalendarAlt
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MoveOutModal = ({ isOpen, onClose, room, tenant, onMoveOut }) => {
  const [reason, setReason] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for moving out');
      return;
    }
    
    if (!moveOutDate) {
      setError('Please select your planned move-out date');
      return;
    }

    // Minimum date validation (must be at least tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (new Date(moveOutDate) < tomorrow) {
      setError('Move-out date must be at least tomorrow');
      return;
    }

    setConfirming(true);
  };
  
  const confirmMoveOut = async () => {
    try {
      setError(null);
      setSubmitting(true);
      
      // Call API to request move-out
      await axios.post(`${API_URL}/rooms/${room._id}/moveout`, {
        userId: tenant?.userId || 'user456', // Use actual user ID if available
        tenantId: tenant?._id, // This helps identify the tenant in the room
        reason,
        moveOutDate,
        notes: 'Submitted through the tenant portal'
      });
      
      setSubmitting(false);
      setSuccess(true);
      
      setTimeout(() => {
        if (onMoveOut) onMoveOut();
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting move-out request:', err);
      setError(err.response?.data?.message || 'Failed to submit move-out request. Please try again.');
      setSubmitting(false);
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <FaDoorOpen className="mr-3 text-red-500" />
              Request to Move Out
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <FaTimesCircle size={24} />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <FaCheckCircle className="text-white text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Move-Out Request Submitted!</h3>
              <p className="text-gray-300 mb-6">
                Your move-out request has been submitted successfully. 
                An admin will process your request shortly.
              </p>
              <button
                onClick={onMoveOut || onClose}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          ) : confirming ? (
            <div>
              <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-white font-medium">Confirm Move-Out Request</p>
                    <p className="text-red-200 mt-1">
                      Are you sure you want to request to move out from {room.roomId || `Room ${room.roomNumber}`}?
                      This will notify the administration and start the move-out process.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Room:</span>
                  <span>{room.roomId || `Room ${room.roomNumber}`}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Move-out date:</span>
                  <span>{new Date(moveOutDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Reason:</span>
                  <span className="text-right">{reason}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={confirmMoveOut}
                  disabled={submitting}
                  className={`px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Move-Out'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-100">
                  <div className="flex items-start">
                    <FaTimesCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 mb-1">Planned Move-Out Date *</label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-3 text-gray-500" />
                    <input
                      type="date"
                      value={moveOutDate}
                      onChange={(e) => setMoveOutDate(e.target.value)}
                      required
                      min={new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]} // Tomorrow
                      className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Reason for Moving Out *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows="3"
                    placeholder="Please explain why you're moving out..."
                  ></textarea>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reason.trim() || !moveOutDate}
                  className={`px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors ${
                    !reason.trim() || !moveOutDate ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveOutModal;