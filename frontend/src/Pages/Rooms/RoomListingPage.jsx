import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch, FaMapMarkerAlt, FaFilter, FaSort, FaBed,
  FaUserFriends, FaWifi, FaShower, FaTv, FaWater,
  FaBath, FaSnowflake, FaClock
} from 'react-icons/fa';
import axios from 'axios';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';
import { useAuth } from '../../Context/AuthContext';
import RoomRequestForm from './RoomRequestForm';
import Modal from '../../Components/Common/Modal'; // Make sure this import is at the top

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Map facility icons
const facilityIcons = {
  'WiFi': <FaWifi />,
  'Private Bathroom': <FaBath />,
  'Air Conditioning': <FaSnowflake />,
  'TV': <FaTv />,
  'Hot Water': <FaWater />,
  'Shower': <FaShower />,
  'Internet': <FaWifi />,
  '24/7 Access': <FaClock />
};

const RoomListingPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [capacity, setCapacity] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState([]);
  const { isAuthenticated } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Common facilities for filtering
  const commonFacilities = [
    'WiFi', 'Private Bathroom', 'Air Conditioning', 'TV', 
    'Hot Water', 'Desk', 'Closet', 'Window', 'Fan'
  ];
  
  // Fetch rooms from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First get all properties
        const propertiesResponse = await axios.get(`${API_URL}/properties`);
        const propertiesData = propertiesResponse.data.data.properties;
        
        setProperties(propertiesData.map(p => ({
          id: p._id,
          name: p.name
        })));
        
        // Get rooms from all properties
        let allRooms = [];
        
        for (const property of propertiesData) {
          try {
            const roomsResponse = await axios.get(`${API_URL}/properties/${property._id}/rooms`);
            const propertyRooms = roomsResponse.data.data.rooms || [];
            
            // Only include available rooms
            const availableRooms = propertyRooms; // Include all rooms
            
            // Format rooms with property information
            const formattedRooms = availableRooms.map(room => ({
              id: room._id,
              roomNumber: room.roomNumber,
              roomId: room.roomId,
              price: room.price || { amount: 0, currency: 'PHP', period: 'monthly' },
              capacity: room.capacity || 1,
              occupants: room.occupants || [],
              facilities: room.facilities || [],
              description: room.description || '',
              size: room.size || { area: '', unit: 'sqm' },
              images: room.images && room.images.length ? room.images : ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg=='],
              status: room.status,
              propertyId: property._id,
              propertyName: property.name,
              propertyAddress: `${property.address.city}, ${property.address.state}`
            }));
            
            allRooms = [...allRooms, ...formattedRooms];
          } catch (err) {
            console.error(`Error fetching rooms for property ${property._id}:`, err);
          }
        }
        
        setRooms(allRooms);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching rooms data:', err);
        setError('Failed to load rooms. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Toggle facility in filter
  const toggleFacility = (facility) => {
    if (facilities.includes(facility)) {
      setFacilities(facilities.filter(f => f !== facility));
    } else {
      setFacilities([...facilities, facility]);
    }
  };
  
  // Filter and sort rooms
  const filteredRooms = rooms
    .filter(room => {
      // Apply search filter
      const matchesSearch = 
        room.roomId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.propertyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply property filter
      const matchesProperty = selectedProperty === '' || room.propertyId === selectedProperty;
      
      // Apply price filter
      let matchesPrice = true;
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        matchesPrice = (room.price?.amount >= min && (max ? room.price?.amount <= max : true));
      }
      
      // Apply capacity filter
      const matchesCapacity = capacity === '' || room.capacity >= parseInt(capacity);
      
      // Apply facilities filter
      let matchesFacilities = true;
      if (facilities.length > 0) {
        matchesFacilities = facilities.every(facility => 
          room.facilities.includes(facility)
        );
      }
      
      return matchesSearch && matchesProperty && matchesPrice && matchesCapacity && matchesFacilities;
    })
    .sort((a, b) => {
      // Sort rooms
      if (sortBy === 'price-asc') {
        return a.price?.amount - b.price?.amount;
      } else if (sortBy === 'price-desc') {
        return b.price?.amount - a.price?.amount;
      } else if (sortBy === 'capacity') {
        return b.capacity - a.capacity;
      } else if (sortBy === 'size') {
        return (b.size?.area || 0) - (a.size?.area || 0);
      }
      // Default sort (recommended)
      return 0;
    });
  
  // Request room handler
  const handleRequestRoom = (room) => {
    setSelectedRoom(room);
    setShowRequestForm(true);
  };
  
  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gray-850 border-b border-gray-800">
          <div className="container mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-4">Available Rooms</h1>
            <p className="text-gray-300 mb-6 max-w-2xl">
              Find and book your perfect room. We offer a variety of rooms with different sizes, 
              amenities, and price ranges to suit your needs.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search rooms by ID, property name or description..."
                className="block w-full pl-10 pr-3 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Filter Section */}
        <div className="bg-gray-850 border-b border-gray-800 py-4">
          <div className="container mx-auto px-4">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-300 hover:text-white md:hidden mb-4"
            >
              <FaFilter className="mr-2" /> 
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            <div className={`md:flex flex-wrap items-center gap-4 ${showFilters ? 'flex flex-col' : 'hidden md:flex'}`}>
              {/* Property Filter */}
              <div className="relative w-full md:w-auto mb-3 md:mb-0">
                <select 
                  value={selectedProperty} 
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full md:w-48 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                >
                  <option value="">All Properties</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="text-gray-400" />
                </div>
              </div>
              
              {/* Price Filter */}
              <div className="relative w-full md:w-auto mb-3 md:mb-0">
                <select 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full md:w-48 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                >
                  <option value="">All Price Ranges</option>
                  <option value="0-5000">LKR:0 - LKR:5,000</option>
                  <option value="5000-10000">LKR:5,000 - LKR:10,000</option>
                  <option value="10000-15000">LKR:10,000 - LKR:15,000</option>
                  <option value="15000-999999">LKR:15,000+</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaFilter className="text-gray-400" />
                </div>
              </div>
              
              {/* Capacity Filter */}
              <div className="relative w-full md:w-auto mb-3 md:mb-0">
                <select 
                  value={capacity} 
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full md:w-36 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                >
                  <option value="">Any Capacity</option>
                  <option value="1">1+ Person</option>
                  <option value="2">2+ Persons</option>
                  <option value="3">3+ Persons</option>
                  <option value="4">4+ Persons</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaUserFriends className="text-gray-400" />
                </div>
              </div>
              
              {/* Sort Options */}
              <div className="relative w-full md:w-auto mb-3 md:mb-0 md:ml-auto">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-48 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="capacity">Highest Capacity</option>
                  <option value="size">Largest Size</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaSort className="text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Facilities Filter */}
            {showFilters && (
              <div className="mt-4 border-t border-gray-700 pt-4">
                <h3 className="text-gray-300 mb-2">Facilities:</h3>
                <div className="flex flex-wrap gap-2">
                  {commonFacilities.map(facility => (
                    <button
                      key={facility}
                      className={`px-3 py-1 rounded-full text-sm flex items-center ${
                        facilities.includes(facility) 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => toggleFacility(facility)}
                    >
                      {facilityIcons[facility] && (
                        <span className="mr-1">{facilityIcons[facility]}</span>
                      )}
                      {facility}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Room Listings */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900 text-white p-4 rounded-lg">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-gray-300">{filteredRooms.length} rooms found</p>
              
              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRooms.map(room => (
                    <div 
                      key={room.id} 
                      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <Link to={`/rooms/${room.id}`}>
                        <div className="h-48 overflow-hidden relative">
                          <img 
                            src={room.images[0]} 
                            alt={`Room ${room.roomNumber}`} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 left-0 w-full p-3 bg-gradient-to-b from-black/50 to-transparent">
                            <div className="flex justify-between items-center">
                              <h3 className="text-white font-bold">
                                {room.roomId || `Room ${room.roomNumber}`}
                              </h3>
                              <span className={`
                                px-2 py-1 rounded text-xs font-medium
                                ${room.status === 'vacant' ? 'bg-green-500 text-white' : ''}
                                ${room.status === 'available' ? 'bg-blue-500 text-white' : ''}
                                ${room.status === 'full' ? 'bg-red-500 text-white' : ''}
                                ${room.status === 'maintenance' ? 'bg-yellow-500 text-white' : ''}
                              `}>
                                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                      
                      <div className="p-5">
                        <Link 
                          to={`/properties/${room.propertyId}`}
                          className="text-amber-400 hover:text-amber-300 text-sm mb-2 inline-block"
                        >
                          {room.propertyName}
                        </Link>
                        
                        <div className="flex items-center text-gray-400 text-sm mb-3">
                          <FaMapMarkerAlt className="mr-1" />
                          <span>{room.propertyAddress}</span>
                        </div>
                        
                        <div className="flex justify-between mb-3">
                          <div className="flex items-center text-gray-300">
                            <FaBed className="mr-2" />
                            <span>
                              {room.occupants.length}/{room.capacity} Occupancy
                            </span>
                          </div>
                          {room.size && room.size.area && (
                            <div className="text-gray-300 text-sm">
                              {room.size.area} {room.size.unit}
                            </div>
                          )}
                        </div>
                        
                        {room.description && (
                          <p className="text-gray-300 text-sm line-clamp-2 mb-3">{room.description}</p>
                        )}
                        
                        {/* Facilities */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {room.facilities.slice(0, 4).map((facility, index) => (
                            <span 
                              key={index} 
                              className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs flex items-center"
                              title={facility}
                            >
                              {facilityIcons[facility] && (
                                <span className="mr-1">{facilityIcons[facility]}</span>
                              )}
                              {facility}
                            </span>
                          ))}
                          {room.facilities.length > 4 && (
                            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                              +{room.facilities.length - 4} more
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                          <div>
                            <p className="text-amber-400 font-bold text-lg">
                              LKR:{room.price.amount.toLocaleString()}
                              <span className="text-gray-400 text-xs font-normal"> / {room.price.period}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              to={`/rooms/${room.id}`}
                              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md transition-colors text-sm"
                            >
                              View Details
                            </Link>
                            {isAuthenticated && (
                              room.status === 'full' ? (
                                <button
                                  disabled
                                  className="bg-gray-600 text-gray-400 px-3 py-1 rounded-md text-sm cursor-not-allowed"
                                  title="This room is currently full"
                                >
                                  Room Full
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRequestRoom(room)}
                                  className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md transition-colors text-sm"
                                >
                                  Request Room
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-850 rounded-lg">
                  <h3 className="text-xl mb-2">No rooms found</h3>
                  <p className="text-gray-400 mb-6">Try adjusting your search criteria or filters</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedProperty('');
                      setPriceRange('');
                      setCapacity('');
                      setFacilities([]);
                      setSortBy('recommended');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Room Request Form Modal */}
        {showRequestForm && selectedRoom && (
          <Modal
            isOpen={showRequestForm}
            onClose={() => {
              setShowRequestForm(false);
              setSelectedRoom(null);
            }}
            title="Request Room"
            size="md"
          >
            <RoomRequestForm 
              room={selectedRoom}
              onSuccess={() => {
                setShowRequestForm(false);
                setSelectedRoom(null);
              }}
              onCancel={() => {
                setShowRequestForm(false);
                setSelectedRoom(null);
              }}
            />
          </Modal>
        )}
      </main>
      <Footer />
    </>
  );
};

export default RoomListingPage;