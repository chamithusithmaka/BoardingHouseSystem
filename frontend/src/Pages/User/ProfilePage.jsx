import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, 
  FaTrash, FaSave, FaTimes, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const ProfilePage = () => {
  const { user, isAuthenticated, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });
  
  const [tenantProfile, setTenantProfile] = useState({
    gender: '',
    age: '',
    occupation: '',
    smoking: false,
    alcoholic: false,
    cleanlinessLevel: 'Medium',
    noiseTolerance: 'Medium',
    sleepingHabit: 'Early sleeper',
    socialBehavior: 'Balanced',
    foodAllergies: '',
    medicalConditions: '',
  });
  
  // Form validation
  const [validation, setValidation] = useState({
    fullName: true,
    email: true,
    phone: true,
    address: true,
  });
  
  // Load user data
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please log in to view your profile' } });
      return;
    }
    
    // Always load from context first for immediate display
    loadFromContext();
    
    // Then try to fetch from API
    fetchUserProfile();
  }, [isAuthenticated, navigate, user]);
  
  // Fetch profile from API using user ID
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get userId from auth context
      const userId = user.id;
      
      if (!userId) {
        loadFromContext();
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/users/profile/${userId}`);
        
        const userData = response.data;
        
        // Set basic profile
        setUserProfile({
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
        });
        
        // Set tenant specific profile if applicable
        if (userData.role === 'Tenant') {
          setTenantProfile({
            gender: userData.gender || '',
            age: userData.age || '',
            occupation: userData.occupation || '',
            smoking: userData.smoking || false,
            alcoholic: userData.alcoholic || false,
            cleanlinessLevel: userData.cleanlinessLevel || 'Medium',
            noiseTolerance: userData.noiseTolerance || 'Medium',
            sleepingHabit: userData.sleepingHabit || 'Early sleeper',
            socialBehavior: userData.socialBehavior || 'Balanced',
            foodAllergies: userData.foodAllergies || '',
            medicalConditions: userData.medicalConditions || '',
          });
        }
      } catch (err) {
        console.log('API call failed, using mock data instead');
        loadFromContext();
        return;
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error in profile handling:', err);
      loadFromContext();
    }
  };
  
  // Load from context (mock mode)
  const loadFromContext = () => {
    setUserProfile({
      fullName: user.name || '',
      email: user.email || '',
      phone: user.phone || '1234567890',
      address: user.location || '',
    });
    
    if (user.role === 'tenant') {
      const savedPreferences = user.tenantProfile || {};
      
      setTenantProfile({
        gender: savedPreferences.gender || 'Male',
        age: savedPreferences.age || '25',
        occupation: savedPreferences.occupation || 'Student',
        smoking: savedPreferences.smoking || false,
        alcoholic: savedPreferences.alcoholic || false,
        cleanlinessLevel: savedPreferences.cleanlinessLevel || 'Medium',
        noiseTolerance: savedPreferences.noiseTolerance || 'Medium',
        sleepingHabit: savedPreferences.sleepingHabit || 'Early sleeper',
        socialBehavior: savedPreferences.socialBehavior || 'Balanced',
        foodAllergies: savedPreferences.foodAllergies || '',
        medicalConditions: savedPreferences.medicalConditions || '',
      });
    }
    
    setLoading(false);
  };
  
  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate phone format
  const isValidPhone = (phone) => {
    // Accept numbers only, 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };
  
  // Validate form
  const validateForm = () => {
    const newValidation = {
      fullName: userProfile.fullName.trim().length > 0,
      email: isValidEmail(userProfile.email),
      phone: isValidPhone(userProfile.phone),
      address: userProfile.address.trim().length > 0,
    };
    
    setValidation(newValidation);
    
    return Object.values(newValidation).every(isValid => isValid);
  };
  
  // Handle form input changes for basic profile
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    // Phone: only 10 digits
    if (name === 'phone') {
      const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
      setUserProfile(prev => ({
        ...prev,
        [name]: sanitized
      }));
      return;
    }
    
    setUserProfile({
      ...userProfile,
      [name]: value
    });
  };
  
  // Handle form input changes for tenant profile
  const handleTenantProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'age') {
      // Only accept numbers between 18-100
      const age = parseInt(value);
      if (isNaN(age) || age < 18) {
        setTenantProfile({
          ...tenantProfile,
          [name]: '18'
        });
        return;
      }
      if (age > 100) {
        setTenantProfile({
          ...tenantProfile,
          [name]: '100'
        });
        return;
      }
    }
    
    setTenantProfile({
      ...tenantProfile,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the validation errors to continue.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get userId from auth context
      const userId = user.id;
      
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      try {
        // Prepare update data
        const updateData = {
          fullName: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone,
          address: userProfile.address,
        };
        
        if (user.role === 'tenant') {
          Object.assign(updateData, {
            gender: tenantProfile.gender,
            age: parseInt(tenantProfile.age),
            occupation: tenantProfile.occupation,
            smoking: tenantProfile.smoking,
            alcoholic: tenantProfile.alcoholic,
            cleanlinessLevel: tenantProfile.cleanlinessLevel,
            noiseTolerance: tenantProfile.noiseTolerance,
            sleepingHabit: tenantProfile.sleepingHabit,
            socialBehavior: tenantProfile.socialBehavior,
            foodAllergies: tenantProfile.foodAllergies,
            medicalConditions: tenantProfile.medicalConditions
          });
        }
        
        // Make API call
        await axios.put(`${API_URL}/users/profile/${userId}`, updateData);
      } catch (apiErr) {
        console.log('API update failed, continuing with local update only');
      }
      
      // Update local context
      const updatedUser = {
        ...user,
        name: userProfile.fullName,
        email: userProfile.email,
        phone: userProfile.phone,
        location: userProfile.address
      };

      // Add tenant preferences if user is tenant
      if (user.role === 'tenant') {
        updatedUser.tenantProfile = {
          gender: tenantProfile.gender,
          age: tenantProfile.age,
          occupation: tenantProfile.occupation,
          smoking: tenantProfile.smoking,
          alcoholic: tenantProfile.alcoholic,
          cleanlinessLevel: tenantProfile.cleanlinessLevel,
          noiseTolerance: tenantProfile.noiseTolerance,
          sleepingHabit: tenantProfile.sleepingHabit,
          socialBehavior: tenantProfile.socialBehavior,
          foodAllergies: tenantProfile.foodAllergies,
          medicalConditions: tenantProfile.medicalConditions
        };
      }
      
      // Update user in context and localStorage
      updateUserProfile(updatedUser);
      
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      
      // Get userId from auth context
      const userId = user.id;
      
      if (userId) {
        try {
          await axios.delete(`${API_URL}/users/profile/${userId}`);
        } catch (apiErr) {
          console.log('API delete failed, continuing with local logout');
        }
      }
      
      // Always logout user
      logout();
      navigate('/', { 
        state: { message: 'Your account has been deleted successfully' } 
      });
      
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
      setLoading(false);
      setIsDeleting(false);
    }
  };
  
  // Cancel editing mode
  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
    
    // Get token
    const token = localStorage.getItem('token');
    
    // If we have a token, refresh from API
    if (token && token !== 'undefined' && token !== 'null') {
      fetchUserProfile(token);
    } else {
      // Otherwise use context data
      loadFromContext();
    }
  };

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>
            
            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-400 flex items-center">
                <FaExclamationTriangle className="flex-shrink-0 mr-2" />
                <p>{error}</p>
                <button 
                  className="ml-auto text-red-400 hover:text-red-300"
                  onClick={() => setError(null)}
                >
                  ×
                </button>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-md text-green-400 flex items-center">
                <FaSave className="flex-shrink-0 mr-2" />
                <p>{success}</p>
                <button 
                  className="ml-auto text-green-400 hover:text-green-300"
                  onClick={() => setSuccess(null)}
                >
                  ×
                </button>
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <FaSpinner className="animate-spin text-amber-500 text-4xl" />
              </div>
            ) : (
              <>
                {/* Basic Profile */}
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-amber-400">
                      Account Information
                    </h2>
                    
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-sm bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-md transition-colors"
                      >
                        <FaEdit className="mr-2" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={cancelEdit}
                          className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md transition-colors"
                        >
                          <FaTimes className="mr-2" />
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateProfile}
                          disabled={loading}
                          className="flex items-center text-sm bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-md transition-colors"
                        >
                          {loading ? (
                            <FaSpinner className="animate-spin mr-2" />
                          ) : (
                            <FaSave className="mr-2" />
                          )}
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <form onSubmit={handleUpdateProfile}>
                      {/* User ID - Read only */}
                      <div className="mb-5">
                        <label className="block text-gray-400 text-sm mb-1">User ID</label>
                        <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-300 border border-gray-600">
                          {user.id}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">User ID cannot be changed</p>
                      </div>
                      
                      {/* Full Name */}
                      <div className="mb-5">
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="fullName">
                          <FaUser className="inline mr-2" />
                          Full Name
                        </label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              id="fullName"
                              name="fullName"
                              value={userProfile.fullName}
                              onChange={handleProfileChange}
                              onKeyDown={e => /[^a-zA-Z\s]/.test(e.key) && e.key !== 'Backspace' && e.preventDefault()}
                              className={`w-full bg-gray-700 border ${!validation.fullName ? 'border-red-500' : 'border-gray-600'} rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500`}
                              required
                            />
                            {!validation.fullName && (
                              <p className="text-red-500 text-xs mt-1">Please enter your full name</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                            {userProfile.fullName}
                          </div>
                        )}
                      </div>
                      
                      {/* Email */}
                      <div className="mb-5">
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="email">
                          <FaEnvelope className="inline mr-2" />
                          Email
                        </label>
                        {isEditing ? (
                          <div>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={userProfile.email}
                              onChange={handleProfileChange}
                              className={`w-full bg-gray-700 border ${!validation.email ? 'border-red-500' : 'border-gray-600'} rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500`}
                              required
                            />
                            {!validation.email && (
                              <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                            {userProfile.email}
                          </div>
                        )}
                      </div>
                      
                      {/* Phone */}
                      <div className="mb-5">
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="phone">
                          <FaPhone className="inline mr-2" />
                          Phone
                        </label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              id="phone"
                              name="phone"
                              value={userProfile.phone}
                              onChange={handleProfileChange}
                              className={`w-full bg-gray-700 border ${!validation.phone ? 'border-red-500' : 'border-gray-600'} rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500`}
                              required
                            />
                            {!validation.phone && (
                              <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit phone number</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                            {userProfile.phone}
                          </div>
                        )}
                      </div>
                      
                      {/* Address */}
                      <div className="mb-5">
                        <label className="block text-gray-400 text-sm mb-1" htmlFor="address">
                          <FaMapMarkerAlt className="inline mr-2" />
                          Address
                        </label>
                        {isEditing ? (
                          <div>
                            <textarea
                              id="address"
                              name="address"
                              value={userProfile.address}
                              onChange={handleProfileChange}
                              rows="3"
                              className={`w-full bg-gray-700 border ${!validation.address ? 'border-red-500' : 'border-gray-600'} rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500`}
                              required
                            />
                            {!validation.address && (
                              <p className="text-red-500 text-xs mt-1">Please enter your address</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                            {userProfile.address}
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
                
                {/* Tenant-specific profile section */}
                {user.role === 'tenant' && (
                  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-gray-700">
                      <h2 className="text-xl font-semibold text-amber-400">
                        Tenant Preferences
                      </h2>
                    </div>
                    
                    <div className="p-6">
                      <form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          {/* Gender */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="gender">
                              Gender
                            </label>
                            {isEditing ? (
                              <select
                                id="gender"
                                name="gender"
                                value={tenantProfile.gender}
                                onChange={handleTenantProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                                {tenantProfile.gender || 'Not specified'}
                              </div>
                            )}
                          </div>
                          
                          {/* Age */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="age">
                              Age
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                id="age"
                                name="age"
                                value={tenantProfile.age}
                                onChange={handleTenantProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                                min="18"
                                max="100"
                              />
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                                {tenantProfile.age || 'Not specified'}
                              </div>
                            )}
                          </div>
                          
                          {/* Occupation */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="occupation">
                              Occupation
                            </label>
                            {isEditing ? (
                              <select
                                id="occupation"
                                name="occupation"
                                value={tenantProfile.occupation}
                                onChange={handleTenantProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="">Select</option>
                                <option value="Student">Student</option>
                                <option value="Employee">Employee</option>
                                <option value="Other">Other</option>
                              </select>
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                                {tenantProfile.occupation || 'Not specified'}
                              </div>
                            )}
                          </div>
                          
                          {/* Cleanliness Level */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="cleanlinessLevel">
                              Cleanliness Level
                            </label>
                            {isEditing ? (
                              <select
                                id="cleanlinessLevel"
                                name="cleanlinessLevel"
                                value={tenantProfile.cleanlinessLevel}
                                onChange={handleTenantProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                                {tenantProfile.cleanlinessLevel}
                              </div>
                            )}
                          </div>
                          
                          {/* Noise Tolerance */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="noiseTolerance">
                              Noise Tolerance
                            </label>
                            {isEditing ? (
                              <select
                                id="noiseTolerance"
                                name="noiseTolerance"
                                value={tenantProfile.noiseTolerance}
                                onChange={handleTenantProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                                {tenantProfile.noiseTolerance}
                              </div>
                            )}
                          </div>
                          
                          {/* Sleeping Habit */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="sleepingHabit">
                              Sleeping Habit
                            </label>
                            {isEditing ? (
                              <select
                                id="sleepingHabit"
                                name="sleepingHabit"
                                value={tenantProfile.sleepingHabit}
                                onChange={handleTenantProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="Early sleeper">Early sleeper</option>
                                <option value="Night owl">Night owl</option>
                              </select>
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                                {tenantProfile.sleepingHabit}
                              </div>
                            )}
                          </div>
                          
                          {/* Social Behavior */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="socialBehavior">
                              Social Behavior
                            </label>
                            {isEditing ? (
                              <select
                                id="socialBehavior"
                                name="socialBehavior"
                                value={tenantProfile.socialBehavior}
                                onChange={handleTenantProfileChange}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                              >
                                <option value="Introvert">Introvert</option>
                                <option value="Balanced">Balanced</option>
                                <option value="Extrovert">Extrovert</option>
                              </select>
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100">
                                {tenantProfile.socialBehavior}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-6">
                          {/* Smoking */}
                          <div className="flex items-center">
                            {isEditing ? (
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  name="smoking"
                                  checked={tenantProfile.smoking}
                                  onChange={handleTenantProfileChange}
                                  className="form-checkbox h-5 w-5 text-amber-500 border-gray-500 rounded focus:ring-0"
                                />
                                <span className="ml-2 text-gray-300">Smoker</span>
                              </label>
                            ) : (
                              <div className={`px-3 py-1 rounded ${tenantProfile.smoking ? 'bg-red-800/30 text-red-400' : 'bg-green-800/30 text-green-400'}`}>
                                {tenantProfile.smoking ? 'Smoker' : 'Non-smoker'}
                              </div>
                            )}
                          </div>
                          
                          {/* Alcoholic */}
                          <div className="flex items-center">
                            {isEditing ? (
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  name="alcoholic"
                                  checked={tenantProfile.alcoholic}
                                  onChange={handleTenantProfileChange}
                                  className="form-checkbox h-5 w-5 text-amber-500 border-gray-500 rounded focus:ring-0"
                                />
                                <span className="ml-2 text-gray-300">Drinks Alcohol</span>
                              </label>
                            ) : (
                              <div className={`px-3 py-1 rounded ${tenantProfile.alcoholic ? 'bg-amber-800/30 text-amber-400' : 'bg-green-800/30 text-green-400'}`}>
                                {tenantProfile.alcoholic ? 'Drinks Alcohol' : 'Non-drinker'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Text Areas */}
                        <div className="mt-6 space-y-5">
                          {/* Food Allergies */}
                          {/* <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="foodAllergies">
                              Food Allergies
                            </label>
                            {isEditing ? (
                              <textarea
                                id="foodAllergies"
                                name="foodAllergies"
                                value={tenantProfile.foodAllergies}
                                onChange={handleTenantProfileChange}
                                rows="2"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                                placeholder="List any food allergies or dietary restrictions..."
                              />
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100 min-h-[60px]">
                                {tenantProfile.foodAllergies || 'None specified'}
                              </div>
                            )}
                          </div> */}
                          
                          {/* Medical Conditions */}
                          <div>
                            <label className="block text-gray-400 text-sm mb-1" htmlFor="medicalConditions">
                              Medical Conditions
                            </label>
                            {isEditing ? (
                              <textarea
                                id="medicalConditions"
                                name="medicalConditions"
                                value={tenantProfile.medicalConditions}
                                onChange={handleTenantProfileChange}
                                rows="2"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                                placeholder="List any relevant medical conditions..."
                              />
                            ) : (
                              <div className="bg-gray-700 px-4 py-2 rounded-md text-gray-100 min-h-[60px]">
                                {tenantProfile.medicalConditions || 'None specified'}
                              </div>
                            )}
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                
                {/* Delete Account Section */}
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-red-500">
                      Delete Account
                    </h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-red-900/20 border border-red-800/50 rounded-md p-4 mb-4">
                      <p className="text-red-400">
                        Warning: Deleting your account is permanent and cannot be undone. 
                        All your data and records will be permanently removed from our system.
                      </p>
                    </div>
                    
                    {!isDeleting ? (
                      <button
                        onClick={() => setIsDeleting(true)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                      >
                        <FaTrash className="mr-2" />
                        Delete My Account
                      </button>
                    ) : (
                      <div className="border border-red-800/50 rounded-md p-4 bg-red-900/20">
                        <p className="text-red-400 font-medium mb-4">
                          Are you absolutely sure you want to delete your account?
                        </p>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setIsDeleting(false)}
                            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                          >
                            {loading ? (
                              <FaSpinner className="animate-spin mr-2" />
                            ) : (
                              <FaTrash className="mr-2" />
                            )}
                            {loading ? 'Processing...' : 'Yes, Delete My Account'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProfilePage;