import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { 
  FaEnvelope, 
  FaLock, 
  FaSpinner, 
  FaExclamationTriangle,
  FaSignInAlt
} from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Check for redirectFrom in location state
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Send login request to the API
      const response = await axios.post(`${API_URL}/users/login`, credentials);
      
      const { token, user } = response.data;
      
      // Use the login function from AuthContext
      await login(user, token);
      
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'owner') {
        navigate('/admin/properties');
      } else if (user.role === 'mealsupplier') {
        navigate('/supplier/dashboard');
      } else {
        // Default for tenant and other roles
        navigate('/');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 403) {
        setError('Your account is pending approval by admin.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
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
            <h1 className="text-3xl font-bold mb-8 text-center">Sign In</h1>
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-md text-red-400 flex items-center">
                <FaExclamationTriangle className="flex-shrink-0 mr-2" />
                <div>
                  <p className="font-medium">Login error</p>
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
            
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <FaEnvelope />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleChange}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:border-amber-500"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-white">Password</label>
                    
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <FaLock />
                    </div>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 pl-10 pr-10 focus:outline-none focus:border-amber-500"
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
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 rounded-md transition-colors flex items-center justify-center ${
                      loading
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <FaSignInAlt className="mr-2" />
                        Sign In
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            <p className="text-center text-gray-400">
              Don't have an account? {' '}
              <Link to="/register" className="text-amber-500 hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LoginPage;