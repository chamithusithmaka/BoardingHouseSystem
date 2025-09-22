import React, { useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';
import { FaLock, FaSpinner, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const ResetPassword = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const userId = user.id;
      
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      await axios.post(`${API_URL}/users/reset-password/${userId}`, {
        currentPassword,
        newPassword
      });
      
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-8">Reset Password</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-400 flex items-center">
                <FaExclamationTriangle className="flex-shrink-0 mr-2" />
                <p>{error}</p>
                <button 
                  className="ml-auto text-red-400 hover:text-red-300"
                  onClick={() => setError('')}
                >
                  ×
                </button>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-800 rounded-md text-green-400 flex items-center">
                <FaCheck className="flex-shrink-0 mr-2" />
                <p>{success}</p>
                <button 
                  className="ml-auto text-green-400 hover:text-green-300"
                  onClick={() => setSuccess('')}
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  {/* Current Password */}
                  <div className="mb-5">
                    <label className="block text-gray-400 text-sm mb-1" htmlFor="currentPassword">
                      <FaLock className="inline mr-2" />
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  
                  {/* New Password */}
                  <div className="mb-5">
                    <label className="block text-gray-400 text-sm mb-1" htmlFor="newPassword">
                      <FaLock className="inline mr-2" />
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  
                  {/* Confirm New Password */}
                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-1" htmlFor="confirmPassword">
                      <FaLock className="inline mr-2" />
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-md transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ResetPassword;