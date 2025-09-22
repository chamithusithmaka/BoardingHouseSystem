import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaBars, FaTimes, FaBed } from 'react-icons/fa';
import { useAuth } from '../../Context/AuthContext';
import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hasRoom, setHasRoom] = useState(false);
  const navigate = useNavigate();
  
  // Use the auth context to get user info and auth status
  const { user, isAuthenticated, logout } = useAuth();
  
  // Check if the user has a room
  useEffect(() => {
    const checkUserRoom = async () => {
      if (!isAuthenticated || !user) {
        setHasRoom(false);
        return;
      }
      
      try {
        // For the temporary user implementation, we'll hardcode hasRoom to true
        // since we know our demo user has a room
        setHasRoom(true);
        
        // In a real implementation with proper backend integration:
        /*
        const response = await axios.get(`${API_URL}/rooms/user/${user.id}/room`);
        setHasRoom(!!response.data.data.room); // Convert to boolean
        */
      } catch (err) {
        // For now, we'll still set hasRoom to true for demo purposes
        setHasRoom(true);
        
        // In a real implementation:
        // setHasRoom(false);
      }
    };
    
    checkUserRoom();
  }, [user, isAuthenticated]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 border-b border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Site Name - Removed logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                BoardingHouse
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <Link to="/properties" className="hover:text-amber-400 transition-colors">
              Properties
            </Link>
            <Link to="/rooms" className="hover:text-amber-400 transition-colors">
              Rooms
            </Link>
            {/* Show My Room link only for logged in users with a room */}
            {isAuthenticated && hasRoom && (
              <Link to="/account/room" className="flex items-center hover:text-amber-400 transition-colors">
                <FaBed className="mr-1" />
                My Room
              </Link>
            )}
            <Link to="/about" className="hover:text-amber-400 transition-colors">
              About Us
            </Link>
            <Link to="/contact" className="hover:text-amber-400 transition-colors">
              Contact
            </Link>
          </div>
          
          {/* Search and User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white">
              <FaSearch size={18} />
            </button>
            
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 hover:text-amber-400 transition-colors"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    <FaUserCircle size={24} />
                  )}
                  <span className="text-sm">{user.name}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-md shadow-xl z-20">
                    <Link 
                      to="/account/profile" 
                      className="block px-4 py-2 text-sm hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    {hasRoom && (
                      <Link 
                        to="/account/room" 
                        className="block px-4 py-2 text-sm hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <FaBed className="mr-2 text-amber-400" />
                          My Room
                        </div>
                      </Link>
                    )}
                    <Link 
                      to="/account/bookings" 
                      className="block px-4 py-2 text-sm hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    {user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        className="block px-4 py-2 text-sm hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link 
                      to="/account/reset-password" 
                      className="block px-4 py-2 text-sm hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Reset Password
                    </Link>
                    <hr className="border-gray-700 my-1" />
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-sm hover:text-amber-400 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="text-sm px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-md transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={toggleMenu}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pt-4 pb-2">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="hover:text-amber-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/properties" 
                className="hover:text-amber-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Properties
              </Link>
              <Link 
                to="/rooms" 
                className="hover:text-amber-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Rooms
              </Link>
              {/* Add My Room to mobile menu as well */}
              {isAuthenticated && hasRoom && (
                <Link 
                  to="/account/room" 
                  className="flex items-center hover:text-amber-400 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaBed className="mr-2" />
                  My Room
                </Link>
              )}
              <Link 
                to="/about" 
                className="hover:text-amber-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                to="/contact" 
                className="hover:text-amber-400 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              <div className="pt-2 border-t border-gray-800">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center py-2">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover mr-2" 
                        />
                      ) : (
                        <FaUserCircle size={20} className="mr-2" />
                      )}
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <Link 
                      to="/account/profile" 
                      className="block py-2 hover:text-amber-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    {hasRoom && (
                      <Link 
                        to="/account/room" 
                        className="block py-2 hover:text-amber-400"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <FaBed className="mr-2 text-amber-400" />
                          My Room
                        </div>
                      </Link>
                    )}
                    <Link 
                      to="/account/bookings" 
                      className="block py-2 hover:text-amber-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    {user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        className="block py-2 hover:text-amber-400"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <Link 
                      to="/account/reset-password" 
                      className="block py-2 hover:text-amber-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Reset Password
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 text-red-400"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-3 pt-2">
                    <Link 
                      to="/login" 
                      className="py-2 text-center hover:text-amber-400"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/register" 
                      className="py-2 bg-amber-500 hover:bg-amber-600 text-center rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;