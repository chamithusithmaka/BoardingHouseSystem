import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUtensils, FaShoppingCart, FaPlus, FaMinus, 
  FaSpinner, FaTimes, FaCheckCircle, FaStar, FaFilter 
} from 'react-icons/fa';
import Modal from '../../Components/Common/Modal';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MealOrderComponent = ({ isOpen, onClose, user, room, onOrderPlaced }) => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [filters, setFilters] = useState({
    mealType: '',
    search: ''
  });
  const [contactInfo, setContactInfo] = useState({
    contactName: user?.name || '',
    contactPhone: '',
    notes: ''
  });

  // Fetch all active meals
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/meals`);
        // Only show active meals
        const activeMeals = response.data.data.meals.filter(meal => meal.isActive);
        setMeals(activeMeals);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError('Failed to load meals. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter meals based on selected type and search query
  const filteredMeals = meals.filter(meal => {
    return (
      (filters.mealType === '' || meal.mealType === filters.mealType) &&
      (filters.search === '' || 
        meal.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        meal.description?.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  // Handle contact info changes
  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add item to cart
  const addToCart = (meal, size) => {
    // Find the price for the selected size
    const sizePrice = meal.sizePrices.find(sp => sp.size === size);
    if (!sizePrice) return;

    const cartItem = {
      mealId: meal._id,
      mealType: meal.mealType,
      nameSnapshot: meal.name,
      size: size,
      unitPriceCentsSnap: sizePrice.priceCents,
      qty: 1,
      lineTotalCents: sizePrice.priceCents,
      image: meal.image
    };

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      item => item.mealId === meal._id && item.size === size
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already in cart
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].qty += 1;
      updatedCart[existingItemIndex].lineTotalCents = 
        updatedCart[existingItemIndex].qty * updatedCart[existingItemIndex].unitPriceCentsSnap;
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart([...cart, cartItem]);
    }
  };

  // Update cart item quantity
  const updateQuantity = (index, change) => {
    const updatedCart = [...cart];
    updatedCart[index].qty = Math.max(1, updatedCart[index].qty + change);
    updatedCart[index].lineTotalCents = 
      updatedCart[index].qty * updatedCart[index].unitPriceCentsSnap;
    setCart(updatedCart);
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculate cart totals
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.lineTotalCents, 0);
  };

  // Submit order
  const placeOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!contactInfo.contactName || !contactInfo.contactPhone) {
      setError('Please provide your name and phone number');
      return;
    }

    try {
      setLoading(true);
      
      // Format cart items for the API
      const orderItems = cart.map(item => ({
        mealId: item.mealId,
        mealType: item.mealType,
        nameSnapshot: item.nameSnapshot,
        unitPriceCentsSnap: item.unitPriceCentsSnap,
        qty: item.qty,
        lineTotalCents: item.lineTotalCents
      }));

      const orderData = {
        contactName: contactInfo.contactName,
        contactPhone: contactInfo.contactPhone,
        roomNo: room?.roomNumber || '',
        notes: contactInfo.notes,
        items: orderItems,
        subtotalCents: calculateTotal(),
        totalCents: calculateTotal()
      };

      const response = await axios.post(`${API_URL}/orders`, orderData);
      
      console.log('Order placed successfully:', response.data);
      setOrderPlaced(true);
      setCart([]);
      
      // Wait for 2 seconds before closing
      setTimeout(() => {
        onOrderPlaced();
      }, 2000);
      
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format price from cents to dollars
  const formatPrice = (cents) => {
    return `LKR:${(cents / 100).toFixed(2)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Meals" size="lg">
      {orderPlaced ? (
        <div className="text-center py-10">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h3 className="text-2xl font-medium text-white mb-2">Order Placed Successfully!</h3>
          <p className="text-gray-400 mb-6">
            Your order has been placed and will be processed shortly.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Meals listing */}
          <div className="flex-1 max-h-[70vh] overflow-y-auto pr-2">
            <div className="mb-4 flex flex-wrap gap-3">
              {/* Filter by meal type */}
              <div className="flex items-center bg-gray-700 rounded-md p-1 mr-2">
                <FaFilter className="text-gray-400 ml-2" />
                <select
                  name="mealType"
                  value={filters.mealType}
                  onChange={handleFilterChange}
                  className="bg-transparent border-none text-white text-sm focus:outline-none px-2 py-1"
                >
                  <option value="">All Meals</option>
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                  <option value="DESSERT">Dessert</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex-grow">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search meals..."
                  className="w-full bg-gray-700 border-none rounded-md px-3 py-1 text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            {loading && meals.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <FaSpinner className="text-amber-500 text-3xl animate-spin" />
              </div>
            ) : filteredMeals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No meals found matching your criteria
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMeals.map(meal => (
                  <div key={meal._id} className="bg-gray-750 rounded-lg overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* Meal image */}
                      <div className="w-full md:w-1/3 h-40 bg-gray-800">
                        {meal.image ? (
                          <img 
                            src={meal.image} 
                            alt={meal.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUtensils className="text-gray-600 text-4xl" />
                          </div>
                        )}
                      </div>
                      
                      {/* Meal details */}
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-white">{meal.name}</h3>
                            <span className="inline-block bg-amber-500 text-xs text-white px-2 py-1 rounded mt-1">
                              {meal.mealType}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <FaStar className="text-yellow-400 mr-1" />
                            <span>{meal.ratingAvg.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        {meal.description && (
                          <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                            {meal.description}
                          </p>
                        )}
                        
                        {/* Size and pricing options */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {meal.sizePrices.map(sizePrice => (
                            <button
                              key={sizePrice.size}
                              onClick={() => addToCart(meal, sizePrice.size)}
                              className="bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md px-3 py-1 transition-colors"
                            >
                              {sizePrice.size}: {formatPrice(sizePrice.priceCents)} <FaPlus className="inline ml-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Order summary */}
          <div className="w-full md:w-64 bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center">
                <FaShoppingCart className="mr-2 text-amber-500" />
                Your Order
              </h3>
              <span className="bg-amber-500 text-xs text-white px-2 py-1 rounded-full">
                {cart.length} items
              </span>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                Your cart is empty
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-700 max-h-48 overflow-y-auto mb-4">
                  {cart.map((item, index) => (
                    <div key={index} className="py-2">
                      <div className="flex justify-between items-start">
                        <div className="text-sm">
                          <div className="text-white">{item.nameSnapshot}</div>
                          <div className="text-gray-400 text-xs">{item.size}</div>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-500 hover:text-red-400 ml-2"
                          title="Remove"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-gray-700 rounded-sm">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="px-2 py-1 text-gray-400 hover:text-white"
                          >
                            <FaMinus />
                          </button>
                          <span className="px-2">{item.qty}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="px-2 py-1 text-gray-400 hover:text-white"
                          >
                            <FaPlus />
                          </button>
                        </div>
                        <span className="font-medium text-white">
                          {formatPrice(item.lineTotalCents)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="font-medium">{formatPrice(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-bold text-white">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </>
            )}
            
            {/* Contact information */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Your Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={contactInfo.contactName}
                  onChange={handleContactInfoChange}
                  placeholder="Enter your name"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-3 text-white text-sm focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={contactInfo.contactPhone}
                  onChange={handleContactInfoChange}
                  placeholder="Your contact number"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-3 text-white text-sm focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Special Instructions</label>
                <textarea
                  name="notes"
                  value={contactInfo.notes}
                  onChange={handleContactInfoChange}
                  placeholder="Any special instructions..."
                  rows="2"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-3 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            
            {error && (
              <div className="mt-4 text-red-500 text-sm p-2 bg-red-900/20 border border-red-900/50 rounded">
                {error}
              </div>
            )}
            
            <button
              onClick={placeOrder}
              disabled={loading || cart.length === 0}
              className={`mt-4 w-full py-2 rounded-md flex items-center justify-center
                ${cart.length === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
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
                  <FaShoppingCart className="mr-2" />
                  Place Order
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MealOrderComponent;