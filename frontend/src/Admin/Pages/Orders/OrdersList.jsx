import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaShoppingCart, FaSearch, FaFilter, FaSpinner, 
  FaEye, FaTrash, FaExclamationCircle, FaCheckCircle, 
  FaTimesCircle, FaClock, FaUtensils, FaTruck, FaSortAmountDown, FaSortAmountUp
} from 'react-icons/fa';
import Modal from '../../../Components/Common/Modal';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortDir: 'desc'
  });
  
  // Fetch orders
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

  // Initial data load
  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle sort direction
  const toggleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Status filter
      if (filters.status && order.status !== filters.status) {
        return false;
      }
      
      // Search by name, phone, room or ID
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const orderId = order._id.substring(order._id.length - 6).toLowerCase();
        return (
          order.contactName.toLowerCase().includes(searchLower) ||
          order.contactPhone.includes(filters.search) ||
          (order.roomNo && order.roomNo.toLowerCase().includes(searchLower)) ||
          orderId.includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort orders
      const field = filters.sortBy;
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      
      if (field === 'createdAt') {
        return (new Date(a.createdAt) - new Date(b.createdAt)) * dir;
      } else if (field === 'totalCents') {
        return (a.totalCents - b.totalCents) * dir;
      } else if (field === 'contactName') {
        return a.contactName.localeCompare(b.contactName) * dir;
      }
      
      return 0;
    });

  // View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  // Show delete confirmation
  const confirmDeleteOrder = (order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  // Delete order
  const deleteOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setActionLoading(true);
      await axios.delete(`${API_URL}/orders/${selectedOrder._id}`);
      setShowDeleteModal(false);
      fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (newStatus) => {
    if (!selectedOrder) return;
    
    try {
      setActionLoading(true);
      await axios.put(`${API_URL}/orders/${selectedOrder._id}/status`, {
        newStatus,
        changedBy: 'admin' // You might want to use the actual admin user info here
      });
      
      // Update the selected order in the UI
      const updatedOrder = {
        ...selectedOrder,
        status: newStatus
      };
      setSelectedOrder(updatedOrder);
      
      // Update the order in the list
      setOrders(orders.map(order => 
        order._id === selectedOrder._id ? updatedOrder : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(`Failed to update order status to ${newStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

 const formatPrice = (cents) => {
  return `LKR ${(cents / 100).toFixed(2)}`;
};

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FaClock className="mr-1" /> Placed
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FaCheckCircle className="mr-1" /> Accepted
          </span>
        );
      case 'PREPARING':
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FaUtensils className="mr-1" /> Preparing
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FaTruck className="mr-1" /> Delivering
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FaCheckCircle className="mr-1" /> Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center">
            <FaTimesCircle className="mr-1" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FaShoppingCart className="mr-3 text-amber-500" />
          Order Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md mb-6">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="float-right"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-md mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Status filter */}
          <div className="flex items-center">
            <FaFilter className="text-gray-400 mr-2" />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PREPARING">Preparing</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-grow">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, phone, room or order ID..."
                className="bg-gray-700 text-white border border-gray-600 rounded pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-md overflow-hidden">
        {loading && !orders.length ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="text-amber-500 text-4xl animate-spin" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Order ID
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Date
                    {filters.sortBy === 'createdAt' && (
                      filters.sortDir === 'desc' ? 
                      <FaSortAmountDown className="ml-1" /> : 
                      <FaSortAmountUp className="ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('contactName')}
                >
                  <div className="flex items-center">
                    Customer
                    {filters.sortBy === 'contactName' && (
                      filters.sortDir === 'desc' ? 
                      <FaSortAmountDown className="ml-1" /> : 
                      <FaSortAmountUp className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Room No.
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('totalCents')}
                >
                  <div className="flex items-center">
                    Total
                    {filters.sortBy === 'totalCents' && (
                      filters.sortDir === 'desc' ? 
                      <FaSortAmountDown className="ml-1" /> : 
                      <FaSortAmountUp className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                    No orders found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {order.orderId || `#${order._id.substring(order._id.length - 6)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{order.contactName}</div>
                      <div className="text-sm text-gray-400">{order.contactPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{order.roomNo || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">{formatPrice(order.totalCents)}</div>
                      <div className="text-xs text-gray-400">{order.items?.length || 0} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-amber-400 hover:text-amber-300 mr-3"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => confirmDeleteOrder(order)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete Order"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={showOrderDetailsModal}
          onClose={() => setShowOrderDetailsModal(false)}
          title={`Order ${selectedOrder.orderId || '#' + selectedOrder._id.substring(selectedOrder._id.length - 6)}`}
          size="lg"
        >
          <div className="max-h-[80vh] overflow-y-auto p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Customer Info */}
              <div className="bg-gray-750 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-medium">{selectedOrder.contactName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white">{selectedOrder.contactPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Room:</span>
                    <span className="text-white">{selectedOrder.roomNo || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Order Info */}
              <div className="bg-gray-750 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">Order Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span>{getStatusBadge(selectedOrder.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white font-medium">{formatPrice(selectedOrder.totalCents)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Notes */}
            {selectedOrder.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">Special Instructions</h3>
                <div className="bg-gray-750 p-4 rounded-md">
                  <p className="text-white">{selectedOrder.notes}</p>
                </div>
              </div>
            )}
            
            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">Order Items</h3>
              <div className="bg-gray-750 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white">{item.nameSnapshot}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs px-2 py-1 bg-gray-700 inline-block rounded">
                            {item.mealType}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm text-white">{formatPrice(item.unitPriceCentsSnap)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm text-white">{item.qty}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm text-white font-medium">{formatPrice(item.lineTotalCents)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="mb-6">
              <div className="bg-gray-750 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white">{formatPrice(selectedOrder.subtotalCents)}</span>
                </div>
                {selectedOrder.discountCents > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Discount:</span>
                    <span className="text-green-400">-{formatPrice(selectedOrder.discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-amber-500">{formatPrice(selectedOrder.totalCents)}</span>
                </div>
              </div>
            </div>
            
            {/* Status History */}
            {selectedOrder.histories && selectedOrder.histories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">Status History</h3>
                <div className="bg-gray-750 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">From</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">To</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {selectedOrder.histories.map((history, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-white">
                            {formatDate(history.changedAt)}
                          </td>
                          <td className="px-4 py-2 text-sm text-white">
                            {history.fromStatus || 'N/A'}
                          </td>
                          <td className="px-4 py-2">
                            {getStatusBadge(history.toStatus)}
                          </td>
                          <td className="px-4 py-2 text-sm text-white">
                            {history.changedBy || 'System'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            {/* <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => updateOrderStatus('CANCELLED')}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Cancel Order
                  </button>
                )}
                
                {selectedOrder.status === 'PLACED' && (
                  <button
                    onClick={() => updateOrderStatus('ACCEPTED')}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Accept Order
                  </button>
                )}
                
                {selectedOrder.status === 'ACCEPTED' && (
                  <button
                    onClick={() => updateOrderStatus('PREPARING')}
                    disabled={actionLoading}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Mark as Preparing
                  </button>
                )}
                
                {selectedOrder.status === 'PREPARING' && (
                  <button
                    onClick={() => updateOrderStatus('OUT_FOR_DELIVERY')}
                    disabled={actionLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Out for Delivery
                  </button>
                )}
                
                {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    onClick={() => updateOrderStatus('DELIVERED')}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
                  >
                    Mark as Delivered
                  </button>
                )}
                
                {actionLoading && (
                  <span className="flex items-center text-amber-500">
                    <FaSpinner className="animate-spin mr-2" /> Processing...
                  </span>
                )}
              </div>
            </div> */}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Order"
      >
        <div className="text-center">
          <FaExclamationCircle className="text-red-500 text-5xl mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Are you sure?</h3>
          <p className="text-gray-400 mb-6">
            Do you really want to delete order #{selectedOrder?._id.substring(selectedOrder?._id.length - 6)}? 
            This action cannot be undone.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={deleteOrder}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center min-w-[100px]"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <FaTrash className="mr-2" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrdersList;
