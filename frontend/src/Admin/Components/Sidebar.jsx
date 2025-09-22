import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaBuilding, FaClipboardList, FaMoneyBillWave, 
  FaArrowCircleLeft, FaArrowCircleRight, FaChartBar, FaSignOutAlt, 
  FaExchangeAlt, FaDoorOpen, FaClock, FaComment, FaUtensils, FaShoppingCart,
  FaUsers
} from 'react-icons/fa';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  // Check if a path is active (current page)
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };
  
  // Menu items with icons and paths
  const menuItems = [
    { name: 'Dashboard', icon: <FaChartBar />, path: '/admin' },
    { name: 'Properties', icon: <FaBuilding />, path: '/admin/properties' },
    { name: 'Room Requests', icon: <FaClipboardList />, path: '/admin/requests/room' },
    { name: 'Transfer Requests', icon: <FaExchangeAlt />, path: '/admin/requests/transfer' },
    { name: 'Move-Out Requests', icon: <FaDoorOpen />, path: '/admin/requests/moveout' },
    { name: 'Attendance', icon: <FaClock />, path: '/admin/attendance' },
    { name: 'Tenant Feedback', icon: <FaComment />, path: '/admin/feedback' },
    { name: 'Meals', icon: <FaUtensils />, path: '/admin/meals' }, // Added Meals
    { name: 'Orders', icon: <FaShoppingCart />, path: '/admin/orders' }, // Added Orders
    { name: 'Users', icon: <FaUsers />, path: '/admin/users' } // Added Users
  ];
  
  return (
    <div 
      className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } fixed left-0 top-0 z-50`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {isOpen ? (
          <Link to="/admin" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
            Admin Portal
          </Link>
        ) : (
          <Link to="/admin" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 mx-auto">
            BP
          </Link>
        )}
        <button 
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-white focus:outline-none"
        >
          {isOpen ? <FaArrowCircleLeft /> : <FaArrowCircleRight />}
        </button>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive(item.path) 
                    ? 'bg-amber-500 text-white' 
                    : 'hover:bg-gray-800'
                }`}
              >
                <span className={`${isOpen ? 'mr-3' : 'mx-auto'}`}>
                  {item.icon}
                </span>
                {isOpen && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link 
          to="/"
          className={`flex items-center p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors`}
        >
          <span className={`${isOpen ? 'mr-3' : 'mx-auto'}`}>
            <FaHome />
          </span>
          {isOpen && <span>Back to Site</span>}
        </Link>
        <Link 
          to="/login"
          className={`flex items-center p-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mt-2`}
        >
          <span className={`${isOpen ? 'mr-3' : 'mx-auto'}`}>
            <FaSignOutAlt />
          </span>
          {isOpen && <span>Logout</span>}
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;