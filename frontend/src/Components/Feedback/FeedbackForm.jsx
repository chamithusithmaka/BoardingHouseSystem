import { useState } from 'react';
import axios from 'axios';
import { 
  FaComment, 
  FaPaperPlane, 
  FaSpinner, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaEnvelope
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const FeedbackForm = ({ user, room, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    comments: '',
    userEmail: user?.email || '' // Default to user's email if available
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'userEmail') {
      // Only allow letters, numbers, @, and .
      const sanitized = value.replace(/[^a-zA-Z0-9@.]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: sanitized
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id || !room?._id || !formData.comments.trim() || !formData.userEmail.trim()) {
      setError('Please provide feedback comments and your email');
      return;
    }

    const feedbackData = {
      userId: user.id,
      userName: user.name || 'Anonymous',
      userEmail: formData.userEmail,
      roomId: room._id,
      propertyId: room.property?._id || null,
      comments: formData.comments
    };

    console.log("Sending feedback data:", feedbackData);

    try {
      setLoading(true);
      setError(null);

      // Create new feedback
      const response = await axios.post(`${API_URL}/feedback`, feedbackData);
      console.log('Feedback submitted:', response.data);

      setSuccess(true);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      if (err.response && err.response.data) {
        console.error('Server error details:', err.response.data);
        setError(err.response.data.message || 'Failed to submit feedback. Please try again.');
      } else {
        setError('Failed to submit feedback. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-5 shadow-lg w-full">
      {success ? (
        <div className="text-center py-6">
          <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h4 className="text-xl font-medium text-white mb-2">Thank You!</h4>
          <p className="text-gray-400">
            Your feedback has been successfully submitted.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-white">
                Share Your Feedback
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Help us improve your boarding experience
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                <FaEnvelope className="mr-2 text-amber-500" />
                Your Email
              </label>
              <input
                type="email"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="Enter your email address"
                required
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                <FaComment className="mr-2 text-amber-500" />
                Your Feedback
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows={6}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                placeholder="Share your thoughts, suggestions, or issues..."
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border-l-4 border-red-500 p-3 rounded">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-md flex items-center justify-center transition-colors focus:outline-none"
              >
                {loading ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  <FaPaperPlane className="mr-2" />
                )}
                Submit Feedback
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;