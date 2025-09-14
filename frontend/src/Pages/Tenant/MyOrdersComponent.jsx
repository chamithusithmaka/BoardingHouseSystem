import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaShoppingBag, FaSpinner, FaExclamationTriangle, 
  FaClock, FaCheckCircle, FaTruck, FaUtensilSpoon, 
  FaTimesCircle, FaSearch, FaChevronDown, FaChevronUp,
  FaStar, FaRegStar
} from 'react-icons/fa';
import ExpenseTrackingComponent from '../../Components/Tenant/ExpenseTrackingComponent';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MyOrdersComponent = ({ user, room }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filter, setFilter] = useState('');
  const [feedback, setFeedback] = useState({}); // Store feedback for each order
  const [submittingFeedback, setSubmittingFeedback] = useState({});
  const [feedbackSuccess, setFeedbackSuccess] = useState({});

  // Fetch user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // We're fetching by contact phone number since that's how the order system identifies users
        const contactPhone = user.phone || '';
        const response = await axios.get(`${API_URL}/orders?contactPhone=${contactPhone}`);
        setOrders(response.data.data.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // Toggle expanded order details
  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Format price from cents to dollars
  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Format date and time
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED':
        return <FaClock className="text-blue-400" />;
      case 'ACCEPTED':
        return <FaCheckCircle className="text-green-400" />;
      case 'PREPARING':
        return <FaUtensilSpoon className="text-yellow-400" />;
      case 'OUT_FOR_DELIVERY':
        return <FaTruck className="text-purple-400" />;
      case 'DELIVERED':
        return <FaCheckCircle className="text-green-500" />;
      case 'CANCELLED':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  // Set rating in feedback
  const setRating = (mealId, rating) => {
    setFeedback(prev => ({
      ...prev,
      [mealId]: {
        ...prev[mealId],
        rating
      }
    }));
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (orderId, mealId) => {
    const feedbackData = feedback[mealId];
    if (!feedbackData || !feedbackData.rating || !feedbackData.comment) {
      alert('Please provide both a rating and a comment.');
      return;
    }

    try {
      setSubmittingFeedback(prev => ({ ...prev, [mealId]: true }));
      await axios.post(`${API_URL}/meals/${mealId}/feedback`, {
        contactName: user.name,
        contactPhone: user.phone,
        rating: parseInt(feedbackData.rating),
        comment: feedbackData.comment
      });

      // Show success message
      setFeedbackSuccess(prev => ({ ...prev, [mealId]: true }));
      
      // Clear form after 3 seconds
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, [mealId]: { rating: '', comment: '' } }));
        setFeedbackSuccess(prev => ({ ...prev, [mealId]: false }));
      }, 3000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [mealId]: false }));
    }
  };

  // Filter orders
  const filteredOrders = filter 
    ? orders.filter(order => order.status === filter)
    : orders;

  // Star Rating Component
  const StarRating = ({ mealId }) => {
    const rating = parseInt(feedback[mealId]?.rating || 0);
    
    return (
      <div className="flex items-center space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(mealId, star)}
            className="focus:outline-none"
          >
            {star <= rating ? (
              <FaStar className="text-amber-400 text-xl" />
            ) : (
              <FaRegStar className="text-gray-400 text-xl hover:text-amber-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div>
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <FaShoppingBag className="mr-3 text-amber-500" />
          My Orders
        </h2>
        
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-md py-1 px-3 text-white text-sm focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Orders</option>
            <option value="PLACED">Placed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="PREPARING">Preparing</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <FaSpinner className="text-amber-500 text-3xl animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-800 rounded-md p-4 flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10">
          <div className="bg-gray-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <FaShoppingBag className="text-gray-500 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Orders Found</h3>
          <p className="text-gray-400">
            {filter ? `You don't have any ${filter.toLowerCase()} orders.` : 'You haven\'t placed any orders yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div 
              key={order._id} 
              className="bg-gray-750 rounded-lg overflow-hidden border border-gray-700"
            >
              {/* Order summary row */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-700 transition-colors flex items-center justify-between"
                onClick={() => toggleOrderDetails(order._id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-700 rounded-md">
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      Order #{order._id.substring(order._id.length - 6)}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {formatPrice(order.totalCents)}
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-gray-700 inline-block">
                      {order.status}
                    </div>
                  </div>
                  {expandedOrderId === order._id ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>
              
              {/* Order details */}
              {expandedOrderId === order._id && (
                <div className="p-4 border-t border-gray-700 bg-gray-800">
                  <div className="mt-4">
                    <h4 className="text-gray-400 text-sm mb-2">Order Items</h4>
                    <div className="bg-gray-750 rounded-md overflow-hidden">
                      {order.items.map((item, index) => (
                        <div 
                          key={index} 
                          className={`p-4 ${index < order.items.length - 1 ? 'border-b border-gray-700' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-white font-medium">{item.nameSnapshot}</div>
                              <div className="text-sm text-gray-400">
                                {item.size} - {formatPrice(item.unitPriceCentsSnap)} x {item.qty}
                              </div>
                              <span className="inline-block mt-1 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                {item.mealType}
                              </span>
                            </div>
                            <div className="text-white font-medium">
                              {formatPrice(item.lineTotalCents)}
                            </div>
                          </div>
                          
                          {/* Feedback Form */}
                          {order.status === 'DELIVERED' && (
                            <div className="mt-4 bg-gray-800 rounded-md p-3 border border-gray-700">
                              <h5 className="text-sm font-medium text-gray-300 mb-2">Rate this meal</h5>
                              
                              {feedbackSuccess[item.mealId] ? (
                                <div className="bg-green-900/30 border border-green-800 text-green-400 p-3 rounded-md flex items-center">
                                  <FaCheckCircle className="mr-2" />
                                  Thank you for your feedback!
                                </div>
                              ) : (
                                <>
                                  <StarRating mealId={item.mealId} />
                                  
                                  <textarea
                                    placeholder="Share your experience with this meal..."
                                    value={feedback[item.mealId]?.comment || ''}
                                    onChange={(e) =>
                                      setFeedback((prev) => ({
                                        ...prev,
                                        [item.mealId]: {
                                          ...prev[item.mealId],
                                          comment: e.target.value
                                        }
                                      }))
                                    }
                                    className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 mt-2 w-full min-h-[80px] focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                  
                                  <div className="mt-3 flex justify-end">
                                    <button
                                      onClick={() => handleFeedbackSubmit(order._id, item.mealId)}
                                      disabled={submittingFeedback[item.mealId]}
                                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
                                    >
                                      {submittingFeedback[item.mealId] ? (
                                        <>
                                          <FaSpinner className="animate-spin mr-2" />
                                          Submitting...
                                        </>
                                      ) : (
                                        <>
                                          <FaStar className="mr-2" />
                                          Submit Review
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          ))}
        </div>
        
      )}
      
    </div>
    {/* Expense Tracking Component */}
      <div className="mt-8">
        <ExpenseTrackingComponent userId={user?.id} />
      </div>
    </div>
    
  );
};

export default MyOrdersComponent;