import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaIdCard, 
  FaPhone, 
  FaMapMarkerAlt,
  FaUserTag,
  FaUpload,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    nic: '',
    phone: '',
    address: '',
    role: 'Tenant',
    gender: '',
    age: '',
    occupation: 'Student',
    smoking: false,
    alcoholic: false,
    cleanlinessLevel: 'Medium',
    noiseTolerance: 'Medium',
    sleepingHabit: 'Early sleeper',
    socialBehavior: 'Balanced',
    foodAllergies: '',
    medicalConditions: '',
    nicCopy: '',
    rentalAgreement: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState({
    nicCopy: null,
    rentalAgreement: null
  });
  const [docsPreview, setDocsPreview] = useState({
    nicCopy: '',
    rentalAgreement: ''
  });
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    nic: '',
    phone: '',
    address: '',
    age: ''
  });

  // Add this function to check if email/NIC already exists
  const checkExistingUserData = async (field, value) => {
    try {
      const response = await axios.post(`${API_URL}/users/check-availability`, { [field]: value });
      return response.data.available;
    } catch (error) {
      console.error(`Error checking ${field} availability:`, error);
      return false; // Assume it's not available on error to be safe
    }
  };

  // Add debounced version to avoid too many requests
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);
  const [nicCheckTimeout, setNicCheckTimeout] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkbox separately
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
      return;
    }

    let updatedErrors = { ...fieldErrors };

    // --- Add this for password validation ---
    if (name === 'password') {
      updatedErrors.password = value.length < 6 ? 'Password must be at least 6 characters' : '';
      // Also check confirm password if already typed
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        updatedErrors.confirmPassword = 'Passwords do not match';
      } else {
        updatedErrors.confirmPassword = '';
      }
    }

    if (name === 'confirmPassword') {
      updatedErrors.confirmPassword = value !== formData.password ? 'Passwords do not match' : '';
    }
    // --- End password validation addition ---

    // Special handling for NIC
    if (name === 'nic') {
      // Only allow valid NIC input pattern: 9 digits + v/V or 12 digits
      const nicRegex = /^(\d{0,9}[vV]?|\d{0,12})$/;
      if (!nicRegex.test(value)) {
        return; // Don't update if invalid format
      }
      
      // Clear any previous timeout to avoid multiple requests
      if (nicCheckTimeout) clearTimeout(nicCheckTimeout);
      
      // Full NIC pattern match for server validation
      const fullNicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
      if (fullNicRegex.test(value)) {
        // Schedule a check after user stops typing
        const newTimeout = setTimeout(async () => {
          try {
            const response = await axios.post(`${API_URL}/users/check-availability`, { nic: value });
            if (!response.data.available) {
              updatedErrors.nic = 'This NIC is already registered';
            } else {
              updatedErrors.nic = '';
            }
            setFieldErrors({...updatedErrors});
          } catch (error) {
            console.error('Error checking NIC:', error);
          }
        }, 600);
        
        setNicCheckTimeout(newTimeout);
      }
    }
    
    // Special handling for email
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value)) {
        // Clear any previous timeout
        if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
        
        // Schedule a check after user stops typing
        const newTimeout = setTimeout(async () => {
          try {
            const response = await axios.post(`${API_URL}/users/check-availability`, { email: value });
            if (!response.data.available) {
              updatedErrors.email = 'This email is already registered';
            } else {
              updatedErrors.email = '';
            }
            setFieldErrors({...updatedErrors});
          } catch (error) {
            console.error('Error checking email:', error);
          }
        }, 600);
        
        setEmailCheckTimeout(newTimeout);
      }
    }
    
    // Special handling for full name - prevent numbers and special chars
    if (name === 'fullName') {
      // Only allow letters and spaces
      if (!/^[A-Za-z\s]*$/.test(value)) {
        return; // Don't update if contains numbers or special chars
      }
    }
    
    // Special handling for age
    if (name === 'age') {
      // Only allow numbers
      if (value !== '' && !/^\d+$/.test(value)) {
        return; // Don't update if not a number
      }
      
      // Enforce minimum age of 18
      const ageNum = parseInt(value);
      if (value !== '' && ageNum < 18) {
        updatedErrors.age = 'Age must be at least 18';
      } else {
        updatedErrors.age = '';
      }
    }
    
    // Update field errors
    setFieldErrors(updatedErrors);
    
    // Update form data
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers
    if (value === '' || /^[0-9]+$/.test(value)) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleDocumentChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setDocuments({
        ...documents,
        [name]: file
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setDocsPreview({
          ...docsPreview,
          [name]: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const validateForm = () => {
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    // NIC validation (Sri Lankan format)
    const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
    if (!nicRegex.test(formData.nic)) {
      setError("Please enter a valid NIC number");
      return false;
    }
    
    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid 10-digit phone number");
      return false;
    }
    
    return true;
  };

  const validateStep = (stepNumber) => {
    let isValid = true;
    let newErrors = { ...fieldErrors };
    
    if (stepNumber === 1) {
      // Validate basic info fields
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
        isValid = false;
      } else {
        newErrors.fullName = '';
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
        isValid = false;
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
        isValid = false;
      } else {
        newErrors.email = '';
      }
      
      // Password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        isValid = false;
      } else {
        newErrors.password = '';
      }
      
      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      } else {
        newErrors.confirmPassword = '';
      }
      
      // NIC validation - Sri Lankan format
      const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
      if (!formData.nic.trim()) {
        newErrors.nic = 'NIC is required';
        isValid = false;
      } else if (!nicRegex.test(formData.nic)) {
        newErrors.nic = 'Please enter a valid NIC (9 digits + v/V or 12 digits)';
        isValid = false;
      } else {
        newErrors.nic = '';
      }
      
      // Phone validation
      const phoneRegex = /^[0-9]{10}$/;
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
        isValid = false;
      } else if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
        isValid = false;
      } else {
        newErrors.phone = '';
      }
      
      // Address validation
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
        isValid = false;
      } else {
        newErrors.address = '';
      }
    }
    
    if (stepNumber === 2 && formData.role === 'Tenant') {
      // Validate tenant-specific fields
      if (formData.age && parseInt(formData.age) < 18) {
        newErrors.age = 'Age must be at least 18';
        isValid = false;
      } else {
        newErrors.age = '';
      }
    }
    
    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps before submission
    if (!validateStep(1) || (formData.role === 'Tenant' && !validateStep(2))) {
      setError("Please fix the validation errors to continue");
      return;
    }

    // Remove this block:
    // if (!documents.nicCopy) {
    //   setError("Please upload a copy of your NIC");
    //   return;
    // }

    // Instead, set a field error:
    if (!documents.nicCopy) {
      setFieldErrors(prev => ({
        ...prev,
        nicCopy: 'Please upload a copy of your NIC'
      }));
      return;
    } else {
      setFieldErrors(prev => ({
        ...prev,
        nicCopy: ''
      }));
    }

    setLoading(true);
    setError(null);
    
    try {
      // Convert documents to base64
      const nicBase64 = documents.nicCopy ? await convertToBase64(documents.nicCopy) : '';
      const agreementBase64 = documents.rentalAgreement ? await convertToBase64(documents.rentalAgreement) : '';

      const dataToSubmit = {
        ...formData,
        nicCopy: nicBase64,
        rentalAgreement: agreementBase64
      };
      
      // Remove confirmPassword as it's not needed in API
      delete dataToSubmit.confirmPassword;
      
      // Send registration request
      await axios.post(`${API_URL}/users/register`, dataToSubmit);
      
      setSuccess(true);
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        nic: '',
        phone: '',
        address: '',
        role: 'Tenant',
        gender: '',
        age: '',
        occupation: 'Student',
        smoking: false,
        alcoholic: false,
        cleanlinessLevel: 'Medium',
        noiseTolerance: 'Medium',
        sleepingHabit: 'Early sleeper',
        socialBehavior: 'Balanced',
        foodAllergies: '',
        medicalConditions: '',
      });
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      // Check if there are any error messages in the fieldErrors object
      const hasErrorMessages = Object.values(fieldErrors).some(error => error !== '');
      
      if (hasErrorMessages) {
        setError("Please fix the highlighted errors to continue");
        return;
      }
      
      setStep(step + 1);
      setError(null);
    } else {
      // Show general error message
      setError("Please fix the highlighted errors to continue");
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  // Add this helper function inside your RegisterPage component:
  const isStep1Invalid = () => {
    // Check for any field error in step 1
    const hasErrors = Object.entries(fieldErrors).some(([key, value]) => {
      // Only check fields relevant to step 1
      return ['fullName', 'email', 'password', 'confirmPassword', 'nic', 'phone', 'address'].includes(key) && value;
    });

    // Check for required fields being empty
    const requiredFields = ['fullName', 'email', 'password', 'confirmPassword', 'nic', 'phone', 'address'];
    const hasEmpty = requiredFields.some(field => !formData[field].trim());

    return hasErrors || hasEmpty;
  };

  // Render step 1 - Basic information
  const renderBasicInfo = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-white mb-1">Full Name *</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaUser />
            </div>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className={`w-full bg-gray-700 text-white border ${
                fieldErrors.fullName ? 'border-red-500' : 'border-gray-600'
              } rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500`}
              placeholder="Your name"
            />
          </div>
          {fieldErrors.fullName && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
          )}
        </div>
        
        <div>
          <label className="block text-white mb-1">Email *</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaEnvelope />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full bg-gray-700 text-white border ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-600'
              } rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500`}
              placeholder="email@example.com"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-1">Password *</label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FaLock />
              </div>
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full bg-gray-700 text-white border ${
                  fieldErrors.password ? 'border-red-500' : 'border-gray-600'
                } rounded-md py-2 pl-10 pr-10 focus:outline-none focus:border-amber-500`}
                placeholder="******"
              />
              <button 
                type="button" 
                className="absolute right-3 top-3 text-gray-400"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>
          
          <div>
            <label className="block text-white mb-1">Confirm Password *</label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FaLock />
              </div>
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full bg-gray-700 text-white border ${
                  fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                } rounded-md py-2 pl-10 pr-10 focus:outline-none focus:border-amber-500`}
                placeholder="******"
              />
              <button 
                type="button" 
                className="absolute right-3 top-3 text-gray-400"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              >
                {confirmPasswordVisible ? "Hide" : "Show"}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white mb-1">NIC Number *</label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FaIdCard />
              </div>
              <input
                type="text"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                required
                className={`w-full bg-gray-700 text-white border ${
                  fieldErrors.nic ? 'border-red-500' : 'border-gray-600'
                } rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500`}
                placeholder="123456789V or 123456789012"
              />
            </div>
            {fieldErrors.nic && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.nic}</p>
            )}
          </div>
          
          <div>
            <label className="block text-white mb-1">Phone Number *</label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FaPhone />
              </div>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleNumberChange}
                required
                maxLength={10}
                className={`w-full bg-gray-700 text-white border ${
                  fieldErrors.phone ? 'border-red-500' : 'border-gray-600'
                } rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500`}
                placeholder="0712345678"
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-white mb-1">Address *</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaMapMarkerAlt />
            </div>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows="2"
              className={`w-full bg-gray-700 text-white border ${
                fieldErrors.address ? 'border-red-500' : 'border-gray-600'
              } rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500`}
              placeholder="Enter your address"
            ></textarea>
          </div>
          {fieldErrors.address && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
          )}
        </div>
        
        <div>
          <label className="block text-white mb-1">Role *</label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaUserTag />
            </div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500"
            >
              <option value="Tenant">Tenant</option>
              <option value="Owner">Property Owner</option>
              <option value="MealSupplier">Meal Supplier</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  // Render step 2 - Role specific information
  const renderRoleSpecificInfo = () => {
    if (formData.role === 'Tenant') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-1">Age</label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className={`w-full bg-gray-700 text-white border ${
                  fieldErrors.age ? 'border-red-500' : 'border-gray-600'
                } rounded-md py-2 px-3 focus:outline-none focus:border-amber-500`}
                placeholder="Enter your age"
                maxLength={3}
              />
              {fieldErrors.age && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.age}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-1">Occupation</label>
              <select
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
              >
                <option value="Student">Student</option>
                <option value="Employee">Employee</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-1">Cleanliness Level</label>
              <select
                name="cleanlinessLevel"
                value={formData.cleanlinessLevel}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-1">Noise Tolerance</label>
              <select
                name="noiseTolerance"
                value={formData.noiseTolerance}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-1">Social Behavior</label>
              <select
                name="socialBehavior"
                value={formData.socialBehavior}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
              >
                <option value="Introvert">Introvert</option>
                <option value="Balanced">Balanced</option>
                <option value="Extrovert">Extrovert</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-1">Sleeping Habit</label>
              <select
                name="sleepingHabit"
                value={formData.sleepingHabit}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
              >
                <option value="Early sleeper">Early Sleeper</option>
                <option value="Night owl">Night Owl</option>
              </select>
            </div>
            <div className="flex flex-col space-y-2 justify-center">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smoking"
                  name="smoking"
                  checked={formData.smoking}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500"
                />
                <label htmlFor="smoking" className="text-white">Smoker</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="alcoholic"
                  name="alcoholic"
                  checked={formData.alcoholic}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 focus:ring-amber-500"
                />
                <label htmlFor="alcoholic" className="text-white">Drinks Alcohol</label>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div>
              <label className="block text-white mb-1">Food Allergies</label>
              <textarea
                name="foodAllergies"
                value={formData.foodAllergies}
                onChange={handleChange}
                rows="2"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
                placeholder="List any food allergies"
              ></textarea>
            </div> */}
            <div>
              <label className="block text-white mb-1">Medical Conditions</label>
              <textarea
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                rows="2"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-amber-500"
                placeholder="List any medical conditions"
              ></textarea>
            </div>
          </div>
        </div>
      );
    } else if (formData.role === 'Owner' || formData.role === 'MealSupplier') {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-md text-center">
            <p className="text-gray-300">No additional information required for {formData.role}.</p>
            <p className="text-gray-300">Please continue to the document upload step.</p>
          </div>
        </div>
      );
    }
  };

  // Render step 3 - Document Upload
  const renderDocumentUpload = () => {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-md">
          <p className="text-amber-500 font-medium mb-2">Required Documents:</p>
          <p className="text-gray-300 mb-4">Please upload clear, readable scans or photos of the following documents.</p>
          
          <div className="space-y-6">
            {/* NIC Upload */}
            <div>
              <label className="block text-white mb-2">
                NIC Copy *
                <span className="text-gray-400 text-sm ml-2">(Front and back)</span>
              </label>
              <div className="flex flex-col space-y-3">
                <label className="relative flex justify-center p-6 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <FaUpload className="mx-auto text-gray-400 text-2xl" />
                    <div className="text-gray-400">
                      <span className="text-amber-500">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG, or PDF (Max 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    name="nicCopy"
                    accept=".jpg,.jpeg,.png,.pdf" 
                    onChange={handleDocumentChange} 
                  />
                </label>
                
                {docsPreview.nicCopy && (
                  <div className="relative p-2 bg-gray-700 rounded-md">
                    {docsPreview.nicCopy.startsWith('data:image') ? (
                      <img 
                        src={docsPreview.nicCopy} 
                        alt="NIC Preview" 
                        className="mx-auto h-36 object-contain" 
                      />
                    ) : (
                      <div className="text-center py-4">
                        <FaIdCard className="mx-auto text-4xl text-gray-400" />
                        <p className="mt-2 text-sm text-gray-300">Document Ready</p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      onClick={() => {
                        setDocuments({...documents, nicCopy: null});
                        setDocsPreview({...docsPreview, nicCopy: ''});
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Rental Agreement Upload (optional) */}
            <div>
              <label className="block text-white mb-2">
                Rental Agreement
                <span className="text-gray-400 text-sm ml-2">(Optional)</span>
              </label>
              <div className="flex flex-col space-y-3">
                <label className="relative flex justify-center p-6 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <FaUpload className="mx-auto text-gray-400 text-2xl" />
                    <div className="text-gray-400">
                      <span className="text-amber-500">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">JPG, PNG, or PDF (Max 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    name="rentalAgreement"
                    accept=".jpg,.jpeg,.png,.pdf" 
                    onChange={handleDocumentChange} 
                  />
                </label>
                
                {docsPreview.rentalAgreement && (
                  <div className="relative p-2 bg-gray-700 rounded-md">
                    {docsPreview.rentalAgreement.startsWith('data:image') ? (
                      <img 
                        src={docsPreview.rentalAgreement} 
                        alt="Agreement Preview" 
                        className="mx-auto h-36 object-contain" 
                      />
                    ) : (
                      <div className="text-center py-4">
                        <FaIdCard className="mx-auto text-4xl text-gray-400" />
                        <p className="mt-2 text-sm text-gray-300">Document Ready</p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      onClick={() => {
                        setDocuments({...documents, rentalAgreement: null});
                        setDocsPreview({...docsPreview, rentalAgreement: ''});
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Create Account</h1>
            
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex justify-center items-center">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
                      step >= stepNumber ? 'border-amber-500 text-amber-500' : 'border-gray-600 text-gray-400'
                    }`}>
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-16 h-1 ${
                        step > stepNumber ? 'bg-amber-500' : 'bg-gray-600'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <div className={`w-1/3 text-center ${step >= 1 ? 'text-amber-500' : 'text-gray-500'}`}>
                  Basic Info
                </div>
                <div className={`w-1/3 text-center ${step >= 2 ? 'text-amber-500' : 'text-gray-500'}`}>
                  {formData.role === 'Tenant' ? 'Preferences' : 'Role Info'}
                </div>
                <div className={`w-1/3 text-center ${step >= 3 ? 'text-amber-500' : 'text-gray-500'}`}>
                  Documents
                </div>
              </div>
            </div>
            
            {/* Success message */}
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-md text-green-400 flex items-center">
                <FaCheck className="flex-shrink-0 mr-2" />
                <div>
                  <p className="font-medium">Registration successful!</p>
                  <p className="text-sm">Your account is pending approval. You will be redirected to the login page.</p>
                </div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-400 flex items-center">
                <FaExclamationTriangle className="flex-shrink-0 mr-2" />
                <div>
                  <p className="font-medium">Registration error</p>
                  <p className="text-sm">{error}</p>
                </div>
                <button 
                  className="ml-auto text-red-400 hover:text-red-300"
                  onClick={() => setError(null)}
                >
                  ×
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                {step === 1 && renderBasicInfo()}
                {step === 2 && renderRoleSpecificInfo()}
                {step === 3 && renderDocumentUpload()}
              </div>
              
              <div className="flex justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div></div>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={step === 1 && isStep1Invalid()}
                    className={`px-6 py-2 rounded-md transition-colors flex items-center ${
                      (step === 1 && isStep1Invalid())
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || success}
                    className={`px-6 py-2 rounded-md transition-colors flex items-center ${
                      loading || success
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Registering...
                      </>
                    ) : success ? (
                      <>
                        <FaCheck className="mr-2" />
                        Registered!
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                )}
              </div>
            </form>
            
            <p className="text-center mt-6 text-gray-400">
              Already have an account? {' '}
              <Link to="/login" className="text-amber-500 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RegisterPage;