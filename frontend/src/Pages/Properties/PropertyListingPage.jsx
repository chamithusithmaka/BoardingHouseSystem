import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaBed, FaFilter, FaSort, FaStar } from 'react-icons/fa';
import axios from 'axios';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const PropertyListingPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/properties`);
        
        // Map API response to component state with room data
        const formattedProperties = await Promise.all(
          response.data.data.properties.map(async (property) => {
            // Get rooms for each property
            try {
              const roomsResponse = await axios.get(`${API_URL}/properties/${property._id}/rooms`);
              const rooms = roomsResponse.data.data.rooms || [];
              
              // Get lowest price room
              let lowestPrice = rooms.length > 0 ? 
                Math.min(...rooms.map(room => room.price?.amount || Infinity)) : 0;
              
              if (lowestPrice === Infinity) lowestPrice = 0;
              
              // Count available rooms
              const availableRooms = rooms.filter(
                room => room.status === 'vacant' || room.status === 'available'
              ).length;
              
              // Calculate average rating
              const rating = property.reviews?.length > 0 ? 
                property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length : 0;
              
              return {
                id: property._id,
                name: property.name,
                address: `${property.address.street}, ${property.address.city}`,
                city: property.address.city,
                description: property.description || '',
                amenities: property.amenities || [],
                lowestPrice,
                totalRooms: rooms.length,
                availableRooms,
                rating: rating || 4.5, // Default rating for demo
                reviewCount: property.reviews?.length || Math.floor(Math.random() * 20) + 1, // Random for demo
                image: property.images && property.images.length > 0 ? 
                  property.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==',
                images: property.images || []
              };
            } catch (err) {
              console.error(`Error fetching rooms for property ${property._id}:`, err);
              return {
                id: property._id,
                name: property.name,
                address: `${property.address.street}, ${property.address.city}`,
                city: property.address.city,
                description: property.description || '',
                amenities: property.amenities || [],
                lowestPrice: 0,
                totalRooms: 0,
                availableRooms: 0,
                rating: 4.5,
                reviewCount: Math.floor(Math.random() * 20) + 1,
                image: property.images && property.images.length > 0 ? 
                  property.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==',
                images: property.images || []
              };
            }
          })
        );
        
        setProperties(formattedProperties);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, []);
  
  // Filter and sort properties
  const filteredProperties = properties
    .filter(property => {
      // Apply search filter
      const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           property.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply location filter
      const matchesLocation = location === '' || property.city.toLowerCase() === location.toLowerCase();
      
      // Apply price filter
      let matchesPrice = true;
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        matchesPrice = (property.lowestPrice >= min && (max ? property.lowestPrice <= max : true));
      }
      
      return matchesSearch && matchesLocation && matchesPrice;
    })
    .sort((a, b) => {
      // Sort properties
      if (sortBy === 'price-asc') {
        return a.lowestPrice - b.lowestPrice;
      } else if (sortBy === 'price-desc') {
        return b.lowestPrice - a.lowestPrice;
      } else if (sortBy === 'rating') {
        return b.rating - a.rating;
      } else if (sortBy === 'availability') {
        return b.availableRooms - a.availableRooms;
      }
      // Default sort (recommended)
      return 0;
    });
    
  // City options for filter (dynamically derived from properties)
  const cityOptions = [...new Set(properties.map(property => property.city))].filter(Boolean);
    
  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gray-850 border-b border-gray-800">
          <div className="container mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-4">Find Your Perfect Boarding House</h1>
            <p className="text-gray-300 mb-6 max-w-2xl">
              Browse through our selection of quality boarding houses and find the perfect accommodation 
              for your needs. Filter by location, price, and amenities.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search properties by name or description..."
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-gray-300 hover:text-white md:hidden"
              >
                <FaFilter className="mr-2" /> 
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              
              <div className={`w-full md:w-auto md:flex items-center gap-4 ${showFilters ? 'flex flex-col' : 'hidden'}`}>
                <div className="relative w-full md:w-auto">
                  <select 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full md:w-40 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                  >
                    <option value="">All Locations</option>
                    {cityOptions.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                </div>
                
                <div className="relative w-full md:w-auto">
                  <select 
                    value={priceRange} 
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full md:w-48 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                  >
                    <option value="">All Price Ranges</option>
                    <option value="0-5000">₱0 - ₱5,000</option>
                    <option value="5000-10000">₱5,000 - ₱10,000</option>
                    <option value="10000-15000">₱10,000 - ₱15,000</option>
                    <option value="15000-999999">₱15,000+</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FaFilter className="text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="relative w-full md:w-auto">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-48 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="availability">Most Available Rooms</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaSort className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Property Listings */}
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
              <p className="mb-4 text-gray-300">{filteredProperties.length} properties found</p>
              
              {filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map(property => (
                    <Link 
                      to={`/properties/${property.id}`} 
                      key={property.id}
                      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="h-56 overflow-hidden relative">
                        <img 
                          src={property.image} 
                          alt={property.name} 
                          className="w-full h-full object-cover"
                        />
                        {property.availableRooms > 0 && (
                          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {property.availableRooms} rooms available
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <h2 className="text-xl font-bold mb-2">{property.name}</h2>
                        
                        <div className="flex items-center text-gray-400 mb-3">
                          <FaMapMarkerAlt className="mr-1 flex-shrink-0" />
                          <span className="text-sm truncate">{property.address}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <FaStar 
                                  key={i}
                                  className={i < Math.round(property.rating) ? "text-amber-400" : "text-gray-600"}
                                  size={14}
                                />
                              ))}
                            </div>
                            <span className="text-gray-400 text-xs ml-2">({property.reviewCount} reviews)</span>
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <FaBed className="mr-1" />
                            <span>{property.totalRooms} Rooms</span>
                          </div>
                        </div>
                        
                        {property.description && (
                          <p className="text-gray-300 text-sm line-clamp-2 mb-4">{property.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {property.amenities.slice(0, 3).map((amenity, index) => (
                            <span 
                              key={index} 
                              className="bg-gray-700 text-gray-300 px-2 py-1 rounded-md text-xs"
                            >
                              {amenity}
                            </span>
                          ))}
                          {property.amenities.length > 3 && (
                            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-md text-xs">
                              +{property.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                          <div>
                            <p className="text-amber-400 font-bold">
                              ₱{property.lowestPrice.toLocaleString()}
                              <span className="text-gray-400 text-xs font-normal"> / month</span>
                            </p>
                          </div>
                          <div className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm">
                            View Details
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-850 rounded-lg">
                  <h3 className="text-xl mb-2">No properties found</h3>
                  <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setLocation('');
                      setPriceRange('');
                      setSortBy('recommended');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PropertyListingPage;