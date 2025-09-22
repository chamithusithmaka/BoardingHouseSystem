import React, { useState } from 'react';
import axios from 'axios';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaPhone, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const AdminRegisterForm = ({ onClose, onAdminAdded }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    nic: '',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Check availability timeouts
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);
  const [nicCheckTimeout, setNicCheckTimeout] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // NIC validation - only allow 9 digits + V/v or 12 digits
    if (name === 'nic') {
      const nicRegex = /^(\d{0,9}[vV]?|\d{0,12})$/;
      if (!nicRegex.test(value)) {
        return;
      }
      
      // Check NIC availability after typing stops
      const fullNicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
      if (fullNicRegex.test(value)) {
        // Clear any previous timeout to avoid multiple requests
        if (nicCheckTimeout) clearTimeout(nicCheckTimeout);
        
        // Schedule a check after user stops typing
        const newTimeout = setTimeout(async () => {
          try {
            const response = await axios.post(`${API_URL}/users/check-availability`, { nic: value });
            if (!response.data.available) {
              setFieldErrors(prev => ({
                ...prev,
                nic: 'This NIC is already registered'
              }));
            } else {
              setFieldErrors(prev => ({
                ...prev,
                nic: ''
              }));
            }
          } catch (error) {
            console.error('Error checking NIC:', error);
          }
        }, 600);
        
        setNicCheckTimeout(newTimeout);
      }
    }

    // Email validation with availability check
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
              setFieldErrors(prev => ({
                ...prev,
                email: 'This email is already registered'
              }));
            } else {
              setFieldErrors(prev => ({
                ...prev,
                email: ''
              }));
            }
          } catch (error) {
            console.error('Error checking email:', error);
          }
        }, 600);
        
        setEmailCheckTimeout(newTimeout);
      }
    }

    // Name validation - only allow letters and spaces
    if (name === 'fullName') {
      if (!/^[A-Za-z\s]*$/.test(value)) {
        return;
      }
    }

    // Phone validation - only allow numbers
    if (name === 'phone') {
      if (!/^\d*$/.test(value)) {
        return;
      }
    }
    
    // Password validation
    if (name === 'password') {
      if (value.length < 6) {
        setFieldErrors(prev => ({
          ...prev,
          password: 'Password must be at least 6 characters'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          password: ''
        }));
      }
      
      // Also check confirm password match
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else if (formData.confirmPassword) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }

    // Confirm password validation
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });

    // Clear field-specific error when user types (only for non-validation errors)
    if (fieldErrors[name] && 
        name !== 'password' && 
        name !== 'confirmPassword' && 
        name !== 'nic' && 
        name !== 'email') {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};

    // Validate full name
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate NIC
    const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
    if (!formData.nic.trim()) {
      errors.nic = 'NIC is required';
    } else if (!nicRegex.test(formData.nic)) {
      errors.nic = 'Please enter a valid NIC (9 digits + v/V or 12 digits)';
    }

    // Validate phone
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Validate address
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create admin registration data
      const adminData = {
        ...formData,
        role: 'Admin',
        status: 'accepted' // Auto-approve admin accounts
      };

      // Remove confirmPassword as it's not needed in API
      delete adminData.confirmPassword;

      // Send registration request
      await axios.post(`${API_URL}/users/register`, adminData);
      
      toast.success('Admin registered successfully');
      onClose();
      
      // Refresh user list
      if (onAdminAdded) {
        onAdminAdded();
      }
      
    } catch (err) {
      console.error('Admin registration error:', err);
      
      // Check if the error is about email or NIC being already registered
      if (err.response?.data?.message === 'Email or NIC already registered.') {
        // Check if email exists
        try {
          const emailCheck = await axios.post(`${API_URL}/users/check-availability`, { email: formData.email });
          
          // Check if NIC exists
          const nicCheck = await axios.post(`${API_URL}/users/check-availability`, { nic: formData.nic });
          
          // Update field errors based on availability
          const updatedFieldErrors = { ...fieldErrors };
          
          if (!emailCheck.data.available) {
            updatedFieldErrors.email = 'This email is already registered';
          }
          
          if (!nicCheck.data.available) {
            updatedFieldErrors.nic = 'This NIC is already registered';
          }
          
          setFieldErrors(updatedFieldErrors);
        } catch (checkError) {
          // If check fails, fallback to generic error
          setError('Email or NIC already registered. Please try with different credentials.');
        }
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeouts on component unmount
  React.useEffect(() => {
    return () => {
      if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
      if (nicCheckTimeout) clearTimeout(nicCheckTimeout);
    };
  }, [emailCheckTimeout, nicCheckTimeout]);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Register New Admin</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-400">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-4">
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
                  placeholder="John Doe"
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
              )}
            </div>
            
            {/* Email */}
            <div className="mb-4">
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
                  placeholder="admin@example.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>
            
            {/* Password */}
            <div className="mb-4">
              <label className="block text-white mb-1">Password *</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FaLock />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full bg-gray-700 text-white border ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-600'
                  } rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500`}
                  placeholder="******"
                />
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block text-white mb-1">Confirm Password *</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FaLock />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`w-full bg-gray-700 text-white border ${
                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                  } rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500`}
                  placeholder="******"
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
            
            {/* NIC */}
            <div className="mb-4">
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
            
            {/* Phone */}
            <div className="mb-4">
              <label className="block text-white mb-1">Phone Number *</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FaPhone />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
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
            
            {/* Address */}
            <div className="mb-6">
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
                  placeholder="Enter address"
                ></textarea>
              </div>
              {fieldErrors.address && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>
              )}
            </div>
            
            {/* Submit button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex items-center justify-center min-w-[100px]"
              >
                {loading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  'Register Admin'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterForm;