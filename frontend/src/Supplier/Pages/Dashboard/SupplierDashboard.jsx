import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaSpinner, FaCheckCircle, FaTimesCircle, FaTruck, 
  FaUtensils, FaClock, FaExclamationTriangle, FaUser, FaPhoneAlt,
  FaPaperPlane
} from 'react-icons/fa';
import Header from '../../../Components/Layout/Header';
import Footer from '../../../Components/Layout/Footer';
import MealsList from '../../../Admin/Pages/Meals/MealsList';
import ReportGenerator from '../../../Components/Reports/ReportGenerator';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const SupplierDashboard = () => {
  // Hardcoded supplier for now
  const supplier = {
    id: 'hardcoded-supplier-id',
    name: 'Hardcoded Supplier'
  };

  // State variables
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyError, setNotifyError] = useState(null);
  const [notifySuccess, setNotifySuccess] = useState(null);
  const [notification, setNotification] = useState({
    subject: '',
    message: '',
    recipientEmail: ''
  });

  // Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/orders`);
        setOrders(response.data.data.orders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setActionLoading(true);
      const response = await axios.put(`${API_URL}/orders/${orderId}/status`, {
        newStatus,
        changedBy: supplier.name // Use supplier name for tracking
      });

      // Update the order in the list
      const updatedOrder = response.data.data.order;
      setOrders(orders.map(order => 
        order._id === orderId ? updatedOrder : order
      ));
    } catch (err) {
      console.error(`Error updating order status to ${newStatus}:`, err);
      setError(`Failed to update order status. ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle notification input changes
  const handleNotifyChange = (e) => {
    setNotification({ ...notification, [e.target.name]: e.target.value });
  };

  // Send notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotifyLoading(true);
    setNotifyError(null);
    setNotifySuccess(null);
    try {
      await axios.post(`${API_URL}/notifications/send`, notification);
      setNotifySuccess('Notification sent successfully!');
      setNotification({ subject: '', message: '', recipientEmail: '' });
    } catch (err) {
      setNotifyError('Failed to send notification.');
    } finally {
      setNotifyLoading(false);
    }
  };

  // Format price from cents to dollars
  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">Accepted</span>;
      case 'PREPARING':
        return <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs">Preparing</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">Delivered</span>;
      case 'CANCELLED':
        return <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">Cancelled</span>;
      default:
        return <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <FaUtensils className="mr-3 text-amber-500" />
            Supplier Dashboard
          </h1>

          {/* Existing content */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-6 text-red-400 flex items-center">
              <FaExclamationTriangle className="mr-2 flex-shrink-0" />
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-red-400 hover:text-red-300"
              >
                &times;
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="text-amber-500 text-4xl animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-10 text-center">
              <div className="bg-gray-700 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-gray-500 text-3xl" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Orders</h3>
              <p className="text-gray-400">
                There are currently no orders to manage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map(order => (
                <div key={order._id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  {/* Order Header */}
                  <div className="bg-gray-750 p-4 flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-400">
                        Order #{order._id.substring(order._id.length - 6)}
                      </div>
                      <div className="text-white font-medium">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Order Content */}
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-sm text-gray-400">Customer</div>
                      <div className="text-white">{order.contactName}</div>
                      <div className="text-gray-400 text-sm">{order.contactPhone}</div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-400">Delivery Location</div>
                      <div className="text-white">Room {order.roomNo || 'N/A'}</div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-400">Order Summary</div>
                      <div className="text-white">{order.items.length} items</div>
                      <div className="font-medium text-amber-500">{formatPrice(order.totalCents)}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-gray-700 bg-gray-750">
                    <div className="grid grid-cols-2 gap-3">
                      {order.status === 'PLACED' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'ACCEPTED')}
                          disabled={actionLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center"
                        >
                          <FaCheckCircle className="mr-2" />
                          Accept Order
                        </button>
                      )}

                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'PREPARING')}
                          disabled={actionLoading}
                          className="bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md flex items-center justify-center"
                        >
                          <FaUtensils className="mr-2" />
                          Start Preparing
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'OUT_FOR_DELIVERY')}
                          disabled={actionLoading}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md flex items-center justify-center"
                        >
                          <FaTruck className="mr-2" />
                          Out for Delivery
                        </button>
                      )}

                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'DELIVERED')}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-md flex items-center justify-center"
                        >
                          <FaCheckCircle className="mr-2" />
                          Mark as Delivered
                        </button>
                      )}

                      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'CANCELLED')}
                          disabled={actionLoading}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-md flex items-center justify-center"
                        >
                          <FaTimesCircle className="mr-2" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report Generator Section */}
          <div className="mt-12">
            <ReportGenerator />
          </div>

          {/* Notification Section */}
          <div className="mt-12 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FaPaperPlane className="mr-3 text-amber-500" />
              Send Notification
            </h2>

            {notifyError && (
              <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-6 text-red-400 flex items-center">
                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                <span>{notifyError}</span>
                <button 
                  onClick={() => setNotifyError(null)} 
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  &times;
                </button>
              </div>
            )}

            {notifySuccess && (
              <div className="bg-green-900/30 border border-green-800 rounded-md p-4 mb-6 text-green-400 flex items-center">
                <FaCheckCircle className="mr-2 flex-shrink-0" />
                <span>{notifySuccess}</span>
                <button 
                  onClick={() => setNotifySuccess(null)} 
                  className="ml-auto text-green-400 hover:text-green-300"
                >
                  &times;
                </button>
              </div>
            )}

            <form onSubmit={handleSendNotification}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm text-gray-400" htmlFor="recipientEmail">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    name="recipientEmail"
                    value={notification.recipientEmail}
                    onChange={handleNotifyChange}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400" htmlFor="subject">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={notification.subject}
                    onChange={handleNotifyChange}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={notification.message}
                    onChange={handleNotifyChange}
                    required
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-amber-500 focus:border-amber-500"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={notifyLoading}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-md flex items-center justify-center"
                >
                  {notifyLoading ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaPaperPlane className="mr-2" />
                  )}
                  Send Notification
                </button>
              </div>
            </form>
          </div>

          {/* Meals List Section */}
          <div className="mt-12">
            <MealsList />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SupplierDashboard;