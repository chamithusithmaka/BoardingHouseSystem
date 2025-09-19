import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUtensils, FaShoppingCart, FaPlus, FaMinus, 
  FaSpinner, FaTimes, FaStar, FaFilter, FaArrowRight,
  FaRegStar, FaComment, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const MealBrowsePage = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(() => {
    // Load cart from local storage if available
    const savedCart = localStorage.getItem('mealCart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [filters, setFilters] = useState({
    mealType: '',
    search: ''
  });
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [mealFeedbacks, setMealFeedbacks] = useState({});
  const [loadingFeedbacks, setLoadingFeedbacks] = useState({});

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

  // Save cart to local storage when it changes
  useEffect(() => {
    localStorage.setItem('mealCart', JSON.stringify(cart));
  }, [cart]);

  // Fetch feedbacks for a specific meal
  const fetchMealFeedbacks = async (mealId) => {
    if (mealFeedbacks[mealId]) return; // Already fetched

    try {
      setLoadingFeedbacks(prev => ({ ...prev, [mealId]: true }));
      const response = await axios.get(`${API_URL}/meals/${mealId}/feedback`);
      setMealFeedbacks(prev => ({ 
        ...prev, 
        [mealId]: response.data.data.feedbacks 
      }));
    } catch (err) {
      console.error(`Error fetching feedback for meal ${mealId}:`, err);
    } finally {
      setLoadingFeedbacks(prev => ({ ...prev, [mealId]: false }));
    }
  };

  // Toggle expanded meal details for feedback
  const toggleMealExpansion = (mealId) => {
    if (expandedMeal === mealId) {
      setExpandedMeal(null);
    } else {
      setExpandedMeal(mealId);
      fetchMealFeedbacks(mealId);
    }
  };

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

  // Format price from cents to dollars
  const formatPrice = (cents) => {
    return `LKR:${(cents / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Proceed to checkout
  const goToCheckout = () => {
    if (cart.length > 0) {
      navigate('/account/meals/checkout');
    }
  };

  // Render star ratings
  const StarRating = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating 
          ? <FaStar key={i} className="text-yellow-400" /> 
          : <FaRegStar key={i} className="text-gray-500" />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FaUtensils className="mr-3 text-amber-500" /> 
                Meal Menu
              </h1>
              <p className="text-gray-400 mt-2">Browse and order delicious meals delivered to your room</p>
            </div>

            {/* Mini Cart Preview */}
            <div className="mt-4 md:mt-0 flex items-center">
              <button 
                onClick={goToCheckout}
                disabled={cart.length === 0}
                className={`flex items-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  cart.length === 0 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                <div className="relative">
                  <FaShoppingCart className="text-xl" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {cart.length}
                    </span>
                  )}
                </div>
                <span>View Cart</span>
                {cart.length > 0 && <span className="font-medium">{formatPrice(calculateTotal())}</span>}
                {cart.length > 0 && <FaArrowRight />}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <div className="flex flex-wrap gap-4">
              {/* Filter by meal type */}
              <div className="flex-grow md:flex-grow-0">
                <label className="block text-sm text-gray-400 mb-2">Meal Type</label>
                <div className="flex items-center bg-gray-700 rounded-md">
                  <FaFilter className="text-gray-400 ml-3" />
                  <select
                    name="mealType"
                    value={filters.mealType}
                    onChange={handleFilterChange}
                    className="bg-gray-700 border-none text-white py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="" className="bg-gray-800 text-white">All Types</option>
                    <option value="BREAKFAST" className="bg-gray-800 text-white">Breakfast</option>
                    <option value="LUNCH" className="bg-gray-800 text-white">Lunch</option>
                    <option value="DINNER" className="bg-gray-800 text-white">Dinner</option>
                    <option value="DESSERT" className="bg-gray-800 text-white">Dessert</option>
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="flex-grow">
                <label className="block text-sm text-gray-400 mb-2">Search</label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search meals..."
                  className="w-full bg-gray-700 border-none rounded-md px-4 py-2 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Meals Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="text-amber-500 text-4xl animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
              >
                Try Again
              </button>
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="text-center py-16 bg-gray-800 rounded-lg">
              <div className="bg-gray-700 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <FaUtensils className="text-gray-500 text-3xl" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Meals Found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                We couldn't find any meals matching your criteria. Please try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeals.map(meal => (
                <div key={meal._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
                  {/* Meal Image */}
                  <div className="h-48 w-full relative">
                    {meal.image ? (
                      <img 
                        src={meal.image} 
                        alt={meal.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-750 flex items-center justify-center">
                        <FaUtensils className="text-gray-600 text-5xl" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                        {meal.mealType}
                      </span>
                    </div>
                  </div>
                  
                  {/* Meal Details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-white">{meal.name}</h3>
                      <button 
                        onClick={() => toggleMealExpansion(meal._id)}
                        className="flex items-center bg-gray-750 px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center">
                          <FaStar className="text-yellow-400 mr-1" />
                          <span className="text-sm">{meal.ratingAvg.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-gray-400 ml-1">({meal.ratingCount})</span>
                        {expandedMeal === meal._id ? (
                          <FaChevronUp className="ml-1 text-gray-400" />
                        ) : (
                          <FaChevronDown className="ml-1 text-gray-400" />
                        )}
                      </button>
                    </div>
                    
                    {meal.description && (
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                        {meal.description}
                      </p>
                    )}

                    {/* Expanded Feedback Section */}
                    {expandedMeal === meal._id && (
                      <div className="mt-3 bg-gray-750 rounded-md p-3 border border-gray-700">
                        <h4 className="font-medium text-sm flex items-center text-white mb-2">
                          <FaComment className="mr-1 text-amber-500" /> Customer Reviews
                        </h4>
                        
                        {loadingFeedbacks[meal._id] ? (
                          <div className="flex justify-center items-center py-4">
                            <FaSpinner className="text-amber-500 animate-spin" />
                          </div>
                        ) : mealFeedbacks[meal._id]?.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto pr-1 space-y-3">
                            {mealFeedbacks[meal._id].map((feedback, index) => (
                              <div key={index} className="bg-gray-800 p-2 rounded">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center">
                                    <StarRating rating={feedback.rating} />
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {formatDate(feedback.createdAt)}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300 mb-1">{feedback.comment}</p>
                                <div className="text-xs text-gray-500">
                                  {feedback.contactName || "Anonymous"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-sm text-gray-400">
                            No reviews yet
                          </div>
                        )}
                      </div>
                    )}

                    {/* Size and Price Options */}
                    <div className="mt-4">
                      <div className="text-gray-400 text-sm mb-2">Available Sizes:</div>
                      <div className="grid grid-cols-3 gap-2">
                        {meal.sizePrices.map(sizePrice => (
                          <button
                            key={sizePrice.size}
                            onClick={() => addToCart(meal, sizePrice.size)}
                            className="flex flex-col items-center justify-between bg-gray-750 hover:bg-gray-700 p-3 rounded-md transition-colors border border-gray-600"
                          >
                            <span className="text-xs text-gray-300 mb-1">{sizePrice.size}</span>
                            <span className="text-amber-500 font-medium">
                              {formatPrice(sizePrice.priceCents)}
                            </span>
                            <FaPlus className="mt-1 text-xs text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Floating Cart Summary */}
          {cart.length > 0 && (
            <div className="fixed bottom-6 right-6">
              <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 w-64">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium flex items-center">
                    <FaShoppingCart className="text-amber-500 mr-2" />
                    <span>Cart Summary</span>
                  </h3>
                  <span className="bg-amber-500 text-xs text-white px-2 py-1 rounded-full">
                    {cart.length} items
                  </span>
                </div>
                <div className="flex justify-between text-lg font-medium">
                  <span className="text-gray-400">Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
                <button
                  onClick={goToCheckout}
                  className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center justify-center"
                >
                  <span>Proceed to Checkout</span>
                  <FaArrowRight className="ml-2" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MealBrowsePage;