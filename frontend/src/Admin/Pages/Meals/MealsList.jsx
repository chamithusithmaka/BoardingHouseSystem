import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUtensils, FaPlus, FaEdit, FaTrash, FaStar, 
  FaFilter, FaSearch, FaSpinner, FaImage, FaTimes,
  FaComment, FaChevronDown, FaChevronUp, FaRegStar
} from 'react-icons/fa';
import Modal from '../../../Components/Common/Modal';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Pass userRole prop to control permissions
const MealsList = ({ userRole = "admin" }) => {
  // Original state variables remain unchanged
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [filters, setFilters] = useState({
    mealType: '',
    search: ''
  });

  // New state variables for handling feedback
  const [expandedMealId, setExpandedMealId] = useState(null);
  const [feedbackDetail, setFeedbackDetail] = useState({});
  const [loadingFeedback, setLoadingFeedback] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentFeedbacks, setCurrentFeedbacks] = useState([]);

  // Form state for add/edit meal
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mealType: 'LUNCH',
    defaultSize: 'MEDIUM',
    sizePrices: [
      { size: 'SMALL', priceCents: 0 },
      { size: 'MEDIUM', priceCents: 0 },
      { size: 'LARGE', priceCents: 0 }
    ],
    image: '',
    isActive: true
  });

  // Image preview
  const [imagePreview, setImagePreview] = useState('');
  const [showSizeTable, setShowSizeTable] = useState(true);

  // Fetch meals from API
  const fetchMeals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/meals`);
      setMeals(response.data.data.meals);
      setError(null);
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load meals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedbacks for a specific meal
  const fetchFeedbacks = async (mealId) => {
    if (feedbackDetail[mealId]) {
      return; // Already fetched
    }
    
    try {
      setLoadingFeedback(prev => ({ ...prev, [mealId]: true }));
      const response = await axios.get(`${API_URL}/meals/${mealId}/feedback`);
      setFeedbackDetail(prev => ({
        ...prev,
        [mealId]: response.data.data.feedbacks || []
      }));
    } catch (err) {
      console.error(`Error fetching feedback for meal ${mealId}:`, err);
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [mealId]: false }));
    }
  };

  // Toggle expand meal to show feedback
  const toggleExpandMeal = (mealId) => {
    if (expandedMealId === mealId) {
      setExpandedMealId(null);
    } else {
      setExpandedMealId(mealId);
      fetchFeedbacks(mealId);
    }
  };

  // View all feedback for a meal
  const viewAllFeedback = (meal) => {
    setCurrentMeal(meal);
    fetchFeedbacks(meal._id);
    setCurrentFeedbacks(feedbackDetail[meal._id] || []);
    setShowFeedbackModal(true);
  };

  // Load meals on component mount
  useEffect(() => {
    fetchMeals();
  }, []);

  // Update current feedbacks when feedback details change
  useEffect(() => {
    if (currentMeal && feedbackDetail[currentMeal._id]) {
      setCurrentFeedbacks(feedbackDetail[currentMeal._id]);
    }
  }, [feedbackDetail, currentMeal]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle size price changes
  const handleSizePriceChange = (size, value) => {
    const updatedSizePrices = formData.sizePrices.map(sp => 
      sp.size === size ? { ...sp, priceCents: parseInt(parseFloat(value) * 100) } : sp
    );
    
    setFormData({
      ...formData,
      sizePrices: updatedSizePrices
    });
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Filter meals based on selected filters and search
  const filteredMeals = meals.filter(meal => {
    return (
      (filters.mealType === '' || meal.mealType === filters.mealType) &&
      (filters.search === '' || 
        meal.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (meal.description || '').toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      setError('Image size should be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setFormData({
        ...formData,
        image: base64String
      });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded image
  const removeImage = () => {
    setFormData({
      ...formData,
      image: ''
    });
    setImagePreview('');
  };

  // Open add meal modal
  const openAddModal = () => {
    setFormData({
      name: '',
      description: '',
      mealType: 'LUNCH',
      defaultSize: 'MEDIUM',
      sizePrices: [
        { size: 'SMALL', priceCents: 0 },
        { size: 'MEDIUM', priceCents: 0 },
        { size: 'LARGE', priceCents: 0 }
      ],
      image: '',
      isActive: true
    });
    setImagePreview('');
    setShowSizeTable(true);
    setShowAddModal(true);
  };

  // Open edit meal modal
  const openEditModal = (meal) => {
    setCurrentMeal(meal);
    
    // Create a sizePrices array that includes all possible sizes
    const allSizePrices = ['SMALL', 'MEDIUM', 'LARGE'].map(size => {
      const existingPrice = meal.sizePrices?.find(sp => sp.size === size);
      return existingPrice || { size, priceCents: 0 };
    });
    
    setFormData({
      name: meal.name,
      description: meal.description || '',
      mealType: meal.mealType,
      defaultSize: meal.defaultSize,
      sizePrices: allSizePrices,
      image: meal.image || '',
      isActive: meal.isActive
    });
    
    setImagePreview(meal.image || '');
    setShowSizeTable(true);
    setShowEditModal(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (meal) => {
    setCurrentMeal(meal);
    setShowDeleteModal(true);
  };

  // Add new meal
  const addMeal = async (e) => {
    e.preventDefault();
    
    // Validate that at least one size has a price
    const hasPrice = formData.sizePrices.some(sp => sp.priceCents > 0);
    if (!hasPrice) {
      setError('At least one size must have a price');
      return;
    }

    // Filter out sizes with no price
    const validSizePrices = formData.sizePrices.filter(sp => sp.priceCents > 0);
    
    // Check if the default size has a price
    if (!validSizePrices.some(sp => sp.size === formData.defaultSize)) {
      setError('The default size must have a price');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const mealData = {
        ...formData,
        sizePrices: validSizePrices
      };
      
      await axios.post(`${API_URL}/meals`, mealData);
      setShowAddModal(false);
      fetchMeals();
    } catch (err) {
      console.error('Error adding meal:', err);
      setError(err.response?.data?.message || 'Failed to add meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update meal
  const updateMeal = async (e) => {
    e.preventDefault();
    
    // Validate that at least one size has a price
    const hasPrice = formData.sizePrices.some(sp => sp.priceCents > 0);
    if (!hasPrice) {
      setError('At least one size must have a price');
      return;
    }

    // Filter out sizes with no price
    const validSizePrices = formData.sizePrices.filter(sp => sp.priceCents > 0);
    
    // Check if the default size has a price
    if (!validSizePrices.some(sp => sp.size === formData.defaultSize)) {
      setError('The default size must have a price');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const mealData = {
        ...formData,
        sizePrices: validSizePrices
      };
      
      await axios.put(`${API_URL}/meals/${currentMeal._id}`, mealData);
      setShowEditModal(false);
      fetchMeals();
    } catch (err) {
      console.error('Error updating meal:', err);
      setError(err.response?.data?.message || 'Failed to update meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete meal
  const deleteMeal = async () => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/meals/${currentMeal._id}`);
      setShowDeleteModal(false);
      fetchMeals();
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Failed to delete meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents) => {
  return `LKR ${(cents / 100).toFixed(2)}`;
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

  // Update getPriceForSize to return empty string if price is 0
  const getPriceForSize = (meal, size) => {
    const sizePrice = meal.sizePrices?.find(sp => sp.size === size);
    return sizePrice && sizePrice.priceCents > 0 ? formatPrice(sizePrice.priceCents) : '';
  };

  // Get available sizes for a meal
  const getAvailableSizes = (meal) => {
    return meal.sizePrices?.map(sp => sp.size) || [];
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

  // Define permissions based on userRole
  const permissions = {
    canCreate: userRole === "supplier",
    canUpdate: userRole === "supplier",
    canDelete: true, // Both admin and supplier can delete
    canViewFeedback: true // Both can view feedback
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FaUtensils className="mr-3 text-amber-500" />
          Meal Management
        </h1>
        
        {/* Only show Add button for suppliers */}
        {permissions.canCreate && (
          <button
            onClick={openAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md flex items-center transition-colors"
          >
            <FaPlus className="mr-2" /> Add New Meal
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gray-800 p-4 rounded-md mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center">
            <FaFilter className="text-gray-400 mr-2" />
            <select
              name="mealType"
              value={filters.mealType}
              onChange={handleFilterChange}
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
            >
              <option value="">All Meal Types</option>
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="DESSERT">Dessert</option>
            </select>
          </div>

          <div className="flex-grow">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search meals..."
                className="bg-gray-700 text-white border border-gray-600 rounded pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Meals Table */}
      <div className="bg-gray-800 rounded-md overflow-hidden">
        {loading && !meals.length ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="text-amber-500 text-4xl animate-spin" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Meal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Image & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Prices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Rating
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
              {filteredMeals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                    No meals found
                  </td>
                </tr>
              ) : (
                filteredMeals.map((meal) => (
                  <>
                    <tr key={meal._id} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div>
                            <div className="text-sm font-medium text-white">{meal.name}</div>
                            <div className="text-sm text-gray-400 line-clamp-2">{meal.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {meal.image ? (
                            <div className="w-12 h-12 rounded overflow-hidden bg-gray-700">
                              <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-700 flex items-center justify-center rounded">
                              <FaUtensils className="text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm text-white">{meal.mealType}</div>
                            <div className="text-xs text-gray-400">Default: {meal.defaultSize}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getAvailableSizes(meal).map(size => (
                            <div key={size} className="flex justify-between items-center text-xs">
                              <span className="text-gray-400">{size}:</span>
                              <span className="text-white font-medium">{getPriceForSize(meal, size)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center">
                            <FaStar className="text-yellow-400 mr-1" />
                            <span className="text-sm text-white">{meal.ratingAvg.toFixed(1)}</span>
                            <span className="text-sm text-gray-400 ml-1">({meal.ratingCount})</span>
                          </div>
                          {meal.ratingCount > 0 && (
                            <button 
                              onClick={() => toggleExpandMeal(meal._id)}
                              className="mt-1 text-xs flex items-center text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              <FaComment className="mr-1" />
                              View Feedback
                              {expandedMealId === meal._id ? 
                                <FaChevronUp className="ml-1" /> : 
                                <FaChevronDown className="ml-1" />
                              }
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          meal.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {meal.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {meal.ratingCount > 0 && permissions.canViewFeedback && (
                          <button
                            onClick={() => viewAllFeedback(meal)}
                            className="text-blue-400 hover:text-blue-300 mr-3"
                          >
                            <FaComment />
                          </button>
                        )}
                        
                        {permissions.canUpdate && (
                          <button
                            onClick={() => openEditModal(meal)}
                            className="text-amber-400 hover:text-amber-300 mr-3"
                          >
                            <FaEdit />
                          </button>
                        )}
                        
                        {permissions.canDelete && (
                          <button
                            onClick={() => openDeleteModal(meal)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Feedback Preview Row */}
                    {expandedMealId === meal._id && (
                      <tr className="bg-gray-750">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <h3 className="text-sm font-medium text-white">Recent Feedback</h3>
                              {meal.ratingCount > 3 && (
                                <button 
                                  onClick={() => viewAllFeedback(meal)}
                                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center"
                                >
                                  View All ({meal.ratingCount})
                                  <FaChevronRight className="ml-1" />
                                </button>
                              )}
                            </div>
                            
                            {loadingFeedback[meal._id] ? (
                              <div className="flex justify-center py-4">
                                <FaSpinner className="text-amber-500 animate-spin" />
                              </div>
                            ) : feedbackDetail[meal._id]?.length > 0 ? (
                              <div className="space-y-2">
                                {feedbackDetail[meal._id].slice(0, 3).map((feedback, index) => (
                                  <div key={index} className="bg-gray-800 p-3 rounded-md">
                                    <div className="flex justify-between">
                                      <div className="flex items-center mb-1">
                                        <StarRating rating={feedback.rating} />
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {formatDate(feedback.createdAt)}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-300">{feedback.comment}</p>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {feedback.contactName || "Anonymous"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 text-center py-2">
                                No feedback available
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Meal Modal (shared form) */}
      {permissions.canCreate && (
        <Modal
          isOpen={showAddModal || showEditModal}
          onClose={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)}
          title={showAddModal ? "Add New Meal" : "Edit Meal"}
          size="lg"
        >
          <form onSubmit={showAddModal ? addMeal : updateMeal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Meal Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onKeyDown={e => /[^a-zA-Z\s]/.test(e.key) && e.preventDefault()}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Meal Type
                </label>
                <select
                  name="mealType"
                  value={formData.mealType}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
                  required
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                  <option value="DESSERT">Dessert</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Meal Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 border border-dashed border-gray-600 rounded-md overflow-hidden flex items-center justify-center relative">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Meal preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                        title="Remove image"
                      >
                        <FaTimes className="text-white text-xs" />
                      </button>
                    </>
                  ) : (
                    <FaImage className="text-gray-500 text-2xl" />
                  )}
                </div>
                
                <div className="flex-grow">
                  <input
                    type="file"
                    id="mealImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="mealImage"
                    className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-md inline-block"
                  >
                    Choose Image
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: 1MB. Recommended: 400x400px
                  </p>
                </div>
              </div>
            </div>
            
            {/* Size & Price Table */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-400">
                  Size & Pricing
                </label>
                <button 
                  type="button"
                  onClick={() => setShowSizeTable(!showSizeTable)}
                  className="text-xs text-amber-500 hover:text-amber-400"
                >
                  {showSizeTable ? 'Hide' : 'Show'} Options
                </button>
              </div>
              
              {showSizeTable && (
                <div className="bg-gray-750 border border-gray-700 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr className="bg-gray-700">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Size</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Price (LKR:)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {['SMALL', 'MEDIUM', 'LARGE'].map(size => {
                        const sizePrice = formData.sizePrices.find(sp => sp.size === size);
                        return (
                          <tr key={size}>
                            <td className="px-4 py-3 text-sm text-white">{size}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={sizePrice?.priceCents > 0 ? (sizePrice.priceCents / 100) : ''}
                                onChange={(e) => handleSizePriceChange(size, e.target.value)}
                                step="0.01"
                                min="0"
                                className="w-20 bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white text-sm focus:border-amber-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="radio"
                                name="defaultSize"
                                value={size}
                                checked={formData.defaultSize === size}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-amber-500 focus:ring-amber-400 border-gray-600 rounded"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 bg-gray-700 text-xs text-gray-400">
                    * Set price to 0 for unavailable sizes
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-amber-500 focus:ring-amber-400 border-gray-600 rounded"
              />
              <label className="ml-2 block text-sm text-gray-400">
                Active (available for ordering)
              </label>
            </div>
            
            {error && (
              <div className="bg-red-900/30 border-l-4 border-red-500 p-3 rounded">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {showAddModal ? 'Adding...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    {showAddModal ? <FaPlus className="mr-2" /> : <FaEdit className="mr-2" />}
                    {showAddModal ? 'Add Meal' : 'Update Meal'}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Meal"
      >
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete this meal?
          </p>
          <p className="text-white font-medium mb-6">
            {currentMeal?.name}
          </p>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={deleteMeal}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              disabled={loading}
            >
              {loading ? (
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

      {/* Feedback Detail Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title={`Feedback for ${currentMeal?.name}`}
        size="lg"
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex mr-2">
                <FaStar className="text-yellow-400" />
                <span className="ml-1 text-white font-medium">{currentMeal?.ratingAvg.toFixed(1)}</span>
              </div>
              <span className="text-gray-400 text-sm">Based on {currentMeal?.ratingCount} reviews</span>
            </div>
          </div>

          {loadingFeedback[currentMeal?._id] ? (
            <div className="flex justify-center items-center h-48">
              <FaSpinner className="text-amber-500 text-2xl animate-spin" />
            </div>
          ) : currentFeedbacks?.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {currentFeedbacks.map((feedback, index) => (
                <div key={index} className="bg-gray-750 p-4 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex mb-1">
                        <StarRating rating={feedback.rating} />
                      </div>
                      <div className="text-sm text-gray-400">
                        {feedback.contactName || 'Anonymous'} • {formatDate(feedback.createdAt)}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300">{feedback.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No feedback available for this meal.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MealsList;

{/* Meals List Section */}
<div className="mt-12">
  <MealsList userRole="admin" />
</div>