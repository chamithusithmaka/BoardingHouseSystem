import { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const AuthContext = createContext();

// Hard-coded Sri Lankan tenant user data
const TEMP_USER = {
  //user456
  id: 'user123',
  name: 'Chamithu Sithmaka',
  email: 'user123456@gmail.com',
  role: 'tenant', // tenant role for regular user
  location: 'Colombo, Sri Lanka',
  avatar: 'https://randomuser.me/api/portraits/men/85.jpg'
};

// Provider component
export const AuthProvider = ({ children }) => {
  // Try to load user from localStorage first
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : TEMP_USER;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedAuthStatus = localStorage.getItem('isAuthenticated');
    return storedAuthStatus === 'true';
  });

  // Mock login function
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.removeItem('room'); // Clear cached room info
  };

  // Mock logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('room'); // Clear cached room info
  };

  // Add updateUserProfile function
  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // This effect would normally check if the user is already logged in
  useEffect(() => {
    // On initial load, if no user in localStorage, set TEMP_USER as logged-in user
    const storedUser = localStorage.getItem('user');
    const storedAuthStatus = localStorage.getItem('isAuthenticated');
    if (!storedUser || storedAuthStatus !== 'true') {
      localStorage.setItem('user', JSON.stringify(TEMP_USER));
      localStorage.setItem('isAuthenticated', 'true');
      setUser(TEMP_USER);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};