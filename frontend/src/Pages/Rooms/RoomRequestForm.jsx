import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../Context/AuthContext';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const RoomRequestForm = ({ room, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    userId: user.id,
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    photo: user.avatar || '',
    notes: '',
    reason: '',
    moveInDate: '',
    status: 'pending' // Default status for user requests
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone: only 10 digits
    if (name === 'phone') {
      const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({ ...formData, phone: sanitized });
      return;
    }

    // Email: only allow letters, numbers, @, .
    if (name === 'email') {
      const sanitized = value.replace(/[^a-zA-Z0-9@.]/g, '');
      setFormData({ ...formData, email: sanitized });
      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Format the data for the API
      const requestData = {
        ...formData,
        userId: user.id,
        // Use the email from the form input, not from context
        email: formData.email, // This ensures we use what the user typed
        roomId: room.id,
        requestDate: new Date(),
      };

      console.log('Submitting room request with data:', requestData);

      // Send request to the API
      await axios.post(`${API_URL}/room-requests`, requestData);
      
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Error submitting room request:', err);
      setError(err.response?.data?.message || 'Failed to submit room request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg text-center">
        <div className="flex justify-center mb-4">
          <FaCheckCircle className="text-green-500 text-5xl" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Request Submitted!</h3>
        <p className="text-gray-300 mb-6">
          Your room request has been submitted successfully. You'll receive a notification once the admin reviews your request.
        </p>
        <button
          onClick={onSuccess || (() => navigate('/account/requests'))}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
        >
          View My Requests
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Request Room</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md flex items-start">
          <FaExclamationTriangle className="text-red-500 mt-1 mr-2 flex-shrink-0" />
          <p className="text-red-100">{error}</p>
        </div>
      )}
      
      <div className="mb-5 p-4 bg-gray-850 rounded-lg border border-gray-700">
        <div className="flex justify-between mb-2">
          <h4 className="font-semibold text-white">{room.roomId || `Room ${room.roomNumber}`}</h4>
          <span className="text-amber-400 font-semibold">
            LKR:{room.price?.amount?.toLocaleString()} / {room.price?.period}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-1">
          {room.propertyName}, {room.propertyAddress}
        </p>
        <p className="text-gray-400 text-sm">
          Capacity: {room.occupants?.length || 0} / {room.capacity}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden fields for user info from context */}
        <input type="hidden" name="userId" value={formData.userId} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 mb-1">Name*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-400 mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Your phone number"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-gray-400 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="your-email@example.com"
          />
        </div>
        
        <div>
          <label className="block text-gray-400 mb-1">Preferred Move-in Date*</label>
          <input
            type="date"
            name="moveInDate"
            value={formData.moveInDate}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-400 mb-1">Reason for Request*</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows="3"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Why are you interested in this room?"
            required
          ></textarea>
        </div>
        
        <div>
          <label className="block text-gray-400 mb-1">Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Any other information you'd like to provide..."
          ></textarea>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Submitting...
              </>
            ) : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomRequestForm;