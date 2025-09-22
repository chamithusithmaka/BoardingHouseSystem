import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUtensils, FaShoppingCart, FaPlus, FaMinus, 
  FaSpinner, FaTimes, FaArrowLeft, FaCheck,
  FaMapMarkerAlt, FaPhoneAlt, FaUser, FaStickyNote
} from 'react-icons/fa';
import { useAuth } from '../../Context/AuthContext';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MealCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    roomNo: location.state?.roomNo || '', // Use roomNo from navigation state if available
    notes: ''
  });

  // Load cart from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('mealCart');
    
    if (!savedCart || JSON.parse(savedCart).length === 0) {
      // Redirect to meals page if cart is empty
      navigate('/account/meals');
      return;
    }
    
    setCart(JSON.parse(savedCart));
  }, [navigate]);

  // Auto-fill room number from user's assigned room
  useEffect(() => {
    // Only fetch if roomNo is not already set
    if (contactInfo.roomNo) return;

    // Try to get roomId from sessionStorage
    const storedRoomId = sessionStorage.getItem('roomId');
    if (storedRoomId) {
      setContactInfo(prev => ({
        ...prev,
        roomNo: storedRoomId
      }));
      return;
    }

    // Fallback: fetch from API if not in sessionStorage
    if (!user?.id) return;
    const fetchRoomNumber = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rooms/user/${user.id}/room`);
        const roomId = response.data?.data?.room?.roomId;
        if (roomId) {
          setContactInfo(prev => ({
            ...prev,
            roomNo: roomId
          }));
          sessionStorage.setItem('roomId', roomId);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchRoomNumber();
  }, [user?.id, contactInfo.roomNo]);

  // Handle contact info changes
  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;

    // Phone: only 10 digits
    if (name === 'contactPhone') {
      const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
      setContactInfo(prev => ({
        ...prev,
        [name]: sanitized
      }));
      return;
    }

    // Room Number: only letters and numbers
    if (name === 'roomNo') {
      const sanitized = value.replace(/[^a-zA-Z0-9]/g, '');
      setContactInfo(prev => ({
        ...prev,
        [name]: sanitized
      }));
      return;
    }

    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update cart item quantity
  const updateQuantity = (index, change) => {
    const updatedCart = [...cart];
    updatedCart[index].qty = Math.max(1, updatedCart[index].qty + change);
    updatedCart[index].lineTotalCents = 
      updatedCart[index].qty * updatedCart[index].unitPriceCentsSnap;
    setCart(updatedCart);
    localStorage.setItem('mealCart', JSON.stringify(updatedCart));
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    localStorage.setItem('mealCart', JSON.stringify(updatedCart));
    
    // Redirect if cart becomes empty
    if (updatedCart.length === 0) {
      navigate('/account/meals');
    }
  };

  // Calculate cart totals
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.lineTotalCents, 0);
  };

  // Format price from cents to dollars
  const formatPrice = (cents) => {
    return `LKR:${(cents / 100).toFixed(2)}`;
  };

  // Back to meals page
  const backToMeals = () => {
    navigate('/account/meals');
  };

  // Place order
  const placeOrder = async () => {
    if (!contactInfo.contactName || !contactInfo.contactPhone || !contactInfo.roomNo) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Format cart items for the API
      const orderItems = cart.map(item => ({
        mealId: item.mealId,
        mealType: item.mealType,
        nameSnapshot: item.nameSnapshot,
        size: item.size,
        unitPriceCentsSnap: item.unitPriceCentsSnap,
        qty: item.qty,
        lineTotalCents: item.lineTotalCents
      }));

      const orderData = {
        contactName: contactInfo.contactName,
        contactPhone: contactInfo.contactPhone,
        roomNo: contactInfo.roomNo,
        notes: contactInfo.notes,
        items: orderItems,
        subtotalCents: calculateTotal(),
        totalCents: calculateTotal(),
        userId: user?.id // <-- Add this line
      };

      const response = await axios.post(`${API_URL}/orders`, orderData);
      
      console.log('Order placed successfully:', response.data);
      setOrderSuccess(true);
      
      // Clear cart
      localStorage.removeItem('mealCart');
      
      // Redirect after successful order
      setTimeout(() => {
        navigate('/account/room', { state: { orderPlaced: true } });
      }, 3000);
      
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex items-center mb-8">
            <button 
              onClick={backToMeals}
              className="mr-4 text-amber-500 hover:text-amber-400"
              disabled={loading || orderSuccess}
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <h1 className="text-3xl font-bold flex items-center">
              <FaShoppingCart className="mr-3 text-amber-500" /> 
              Checkout
            </h1>
          </div>

          {orderSuccess ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center max-w-2xl mx-auto">
              <div className="bg-green-500 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
                <FaCheck className="text-white text-4xl" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Order Placed Successfully!</h2>
              <p className="text-gray-400 mb-6">
                Your order has been received and will be processed shortly. 
                You can track your order status in the My Orders section.
              </p>
              <div className="animate-pulse text-sm text-gray-500">
                Redirecting to your room page...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Summary */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                    
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        Your cart is empty
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {cart.map((item, index) => (
                          <div key={index} className="py-4 flex">
                            {/* Item Image */}
                            <div className="w-20 h-20 bg-gray-750 mr-4 rounded overflow-hidden">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.nameSnapshot}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FaUtensils className="text-gray-600 text-2xl" />
                                </div>
                              )}
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-medium">{item.nameSnapshot}</h3>
                                  <div className="flex items-center text-sm text-gray-400 space-x-2">
                                    <span>{item.mealType}</span>
                                    <span>•</span>
                                    <span>{item.size}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFromCart(index)}
                                  className="text-red-500 hover:text-red-400"
                                  title="Remove item"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                              
                              {/* Quantity and Price */}
                              <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center bg-gray-750 rounded-md">
                                  <button
                                    onClick={() => updateQuantity(index, -1)}
                                    className="px-3 py-1 text-gray-400 hover:text-white focus:outline-none"
                                    disabled={loading}
                                  >
                                    <FaMinus />
                                  </button>
                                  <span className="w-8 text-center">{item.qty}</span>
                                  <button
                                    onClick={() => updateQuantity(index, 1)}
                                    className="px-3 py-1 text-gray-400 hover:text-white focus:outline-none"
                                    disabled={loading}
                                  >
                                    <FaPlus />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-400">
                                    {formatPrice(item.unitPriceCentsSnap)} each
                                  </div>
                                  <div className="font-medium">
                                    {formatPrice(item.lineTotalCents)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Order Totals */}
                  <div className="bg-gray-750 p-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Subtotal</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span className="text-amber-500">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Checkout Form */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                        <FaUser className="mr-2 text-amber-500" />
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        value={contactInfo.contactName}
                        onChange={handleContactInfoChange}
                        onKeyDown={e => /[^a-zA-Z\s]/.test(e.key) && e.preventDefault()}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Enter your name"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                        <FaPhoneAlt className="mr-2 text-amber-500" />
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        name="contactPhone"
                        value={contactInfo.contactPhone}
                        onChange={handleContactInfoChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Your contact number"
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-amber-500" />
                        Room Number *
                      </label>
                      <input
                        type="text"
                        name="roomNo"
                        value={contactInfo.roomNo}
                        onChange={handleContactInfoChange}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Your room number"
                        required
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
                        <FaStickyNote className="mr-2 text-amber-500" />
                        Special Instructions
                      </label>
                      <textarea
                        name="notes"
                        value={contactInfo.notes}
                        onChange={handleContactInfoChange}
                        rows="3"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                        placeholder="Any special instructions..."
                        disabled={loading}
                      />
                    </div>
                    
                    {error && (
                      <div className="bg-red-900/30 border border-red-800 rounded-md p-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}
                    
                    <button
                      onClick={placeOrder}
                      disabled={loading || cart.length === 0}
                      className={`w-full py-3 rounded-md font-medium flex items-center justify-center
                        ${loading || cart.length === 0
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                    >
                      {loading ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Place Order
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MealCheckoutPage;