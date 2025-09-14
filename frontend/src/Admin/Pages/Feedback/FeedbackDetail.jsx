import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaComment, FaArrowLeft, FaSpinner, FaExclamationTriangle,
  FaUser, FaHome, FaCalendarAlt, FaReply, FaPaperPlane,
  FaCheckCircle
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [response, setResponse] = useState('');
  
  // Fetch feedback details
  useEffect(() => {
    const fetchFeedbackDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/feedback/${id}`);
        setFeedback(response.data.data.feedback);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback details:', err);
        setError(err.response?.data?.message || 'Failed to load feedback details');
        setLoading(false);
      }
    };
    
    fetchFeedbackDetail();
  }, [id]);
  
  // Handle response submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!response.trim()) {
      return; // Don't submit if empty
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Admin info - in a real app, get this from auth context
      const adminUser = {
        name: 'Admin',
        email: 'admin@boardinghouse.com'
      };
      
      await axios.put(`${API_URL}/feedback/${id}`, {
        status: 'responded',
        adminResponse: {
          message: response,
          respondedBy: adminUser.name,
          responseDate: new Date()
        }
      });
      
      setSuccess(true);
      setSubmitting(false);
      
      // After a short delay, redirect back to the feedback list
      setTimeout(() => {
        navigate('/admin/feedback');
      }, 2000);
      
    } catch (err) {
      console.error('Error sending response:', err);
      setError(err.response?.data?.message || 'Failed to send response');
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/admin/feedback')}
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center mb-6 transition-colors"
      >
        <FaArrowLeft className="mr-2" /> 
        Back to Feedback List
      </button>
      
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
      ) : feedback ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feedback Details */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-xl font-bold text-white flex items-center">
                  <FaComment className="mr-3 text-amber-500" />
                  Tenant Feedback
                </h1>
                <div className="bg-blue-900 text-blue-300 px-3 py-1 rounded text-xs">
                  {feedback.status.toUpperCase()}
                </div>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-gray-300 whitespace-pre-wrap">{feedback.comments}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <FaUser className="mr-2" /> Tenant:
                  </div>
                  <div className="text-white">{feedback.userName}</div>
                  <div className="text-xs text-gray-400 mt-1">ID: {feedback.userId}</div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <FaHome className="mr-2" /> Room:
                  </div>
                  <div className="text-white">
                    {feedback.roomId?.roomNumber || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Property: {feedback.propertyId?.name || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <FaCalendarAlt className="mr-2" /> Submitted:
                </div>
                <div className="text-white">{formatDate(feedback.createdAt)}</div>
              </div>
            </div>
            
            {/* Previous Response (if any) */}
            {feedback.adminResponse && feedback.adminResponse.message && (
              <div className="bg-green-900/30 border-l-4 border-green-500 rounded-lg p-4 mb-6">
                <div className="flex items-center text-green-400 text-sm font-medium mb-2">
                  <FaReply className="mr-2" /> 
                  Previous Response from {feedback.adminResponse.respondedBy || 'Admin'}
                </div>
                <div className="text-gray-300 whitespace-pre-wrap">
                  {feedback.adminResponse.message}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Sent on {formatDate(feedback.adminResponse.responseDate)}
                </div>
              </div>
            )}
            
            {/* Response Form */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              {success ? (
                <div className="text-center p-6">
                  <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">Response Sent Successfully!</h3>
                  <p className="text-gray-400 mb-4">
                    Your response has been sent to the tenant.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-white flex items-center mb-4">
                    <FaPaperPlane className="mr-3 text-amber-500" />
                    Send Response
                  </h2>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">
                        Response Message
                      </label>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-3 px-4 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Enter your response to the tenant..."
                        rows={6}
                        required
                      />
                    </div>
                    
                    {feedback.userEmail ? (
                      <div className="text-xs text-gray-400 mb-4">
                        Response will be sent to: {feedback.userEmail}
                      </div>
                    ) : (
                      <div className="text-xs text-yellow-400 mb-4">
                        <FaExclamationTriangle className="inline mr-1" />
                        Warning: No email provided. Email notification cannot be sent.
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={submitting || !response.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center justify-center w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <><FaSpinner className="animate-spin mr-2" /> Sending...</>
                      ) : (
                        <><FaPaperPlane className="mr-2" /> Send Response</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
          
          {/* Additional Info Panel */}
          <div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Tenant Information</h2>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Tenant ID</p>
                <p className="text-white font-mono">{feedback.userId}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Room</p>
                <p className="text-white">{feedback.roomId?.roomNumber || 'N/A'}</p>
              </div>
              
              {feedback.propertyId && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Property</p>
                  <p className="text-white">{feedback.propertyId?.name || 'N/A'}</p>
                  <p className="text-gray-400 text-xs mt-1">{feedback.propertyId?.location || 'N/A'}</p>
                </div>
              )}
              
              <hr className="border-gray-700 my-4" />
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Submission Date</p>
                <p className="text-white">{formatDate(feedback.createdAt)}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Last Updated</p>
                <p className="text-white">{formatDate(feedback.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Feedback not found</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackDetail;