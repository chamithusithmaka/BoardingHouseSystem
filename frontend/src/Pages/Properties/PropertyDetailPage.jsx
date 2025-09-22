import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaBed, 
  FaArrowLeft, FaStar, FaCheckCircle, FaChevronLeft, 
  FaChevronRight, FaUserFriends, FaRulerCombined,
  FaWifi, FaParking, FaShieldAlt, FaTshirt, FaUtensils, FaUsers, 
} from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Map amenity icons
const amenityIcons = {
  'WiFi': <FaWifi className="text-amber-400 mr-2" />,
  'Parking': <FaParking className="text-amber-400 mr-2" />,
  'Security': <FaShieldAlt className="text-amber-400 mr-2" />,
  'Laundry': <FaTshirt className="text-amber-400 mr-2" />,
  'Kitchen': <FaUtensils className="text-amber-400 mr-2" />,
  'Common Area': <FaUsers className="text-amber-400 mr-2" />
};

const PropertyDetailPage = () => {
  const { id: propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    vacant: 0,
    full: 0
  });
  
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        setLoading(true);
        
        // Get property details
        const propertyResponse = await axios.get(`${API_URL}/properties/${propertyId}`);
        setProperty(propertyResponse.data.data.property);
        
        // Get rooms for this property
        const roomsResponse = await axios.get(`${API_URL}/properties/${propertyId}/rooms`);
        setRooms(roomsResponse.data.data.rooms);
        
        // Get property statistics
        const statsResponse = await axios.get(`${API_URL}/properties/${propertyId}/stats`);
        setStats(statsResponse.data.data.stats);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching property details:', err);
        setError('Failed to load property details. Please try again later.');
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchPropertyDetails();
    }
    
    // Reset image index when property changes
    setActiveImageIndex(0);
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [propertyId]);

  // Handle image navigation
  const nextImage = () => {
    if (property && property.images && property.images.length > 0) {
      setActiveImageIndex((prevIndex) => 
        prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (property && property.images && property.images.length > 0) {
      setActiveImageIndex((prevIndex) => 
        prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
      );
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || !price.amount) return 'Price not specified';
    return `LKR:${price.amount.toLocaleString()} / ${price.period || 'month'}`;
  };

  // Generate a placeholder image if no images are available
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==';

  // Calculate average rating based on reviews
  const calculateAverageRating = () => {
    if (!property?.reviews || property.reviews.length === 0) {
      return 4.5; // Default rating if no reviews exist
    }
    
    const sum = property.reviews.reduce((total, review) => total + review.rating, 0);
    return sum / property.reviews.length;
  };

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white min-h-screen pb-12">
        {loading ? (
          <div className="container mx-auto px-4 py-20 flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-red-900/50 border border-red-500 text-white p-6 rounded-lg max-w-3xl mx-auto">
              <h3 className="text-xl font-bold mb-3">Error</h3>
              <p>{error}</p>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
                >
                  Try Again
                </button>
                <button
                  onClick={goBack}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white flex items-center"
                >
                  <FaArrowLeft className="mr-2" /> Go Back
                </button>
              </div>
            </div>
          </div>
        ) : property ? (
          <>
            {/* Back button */}
            <div className="container mx-auto px-4 py-4">
              <button
                onClick={goBack}
                className="flex items-center text-gray-400 hover:text-amber-400 transition-colors"
              >
                <FaArrowLeft className="mr-1" /> Back to Properties
              </button>
            </div>
            
            {/* Property Photos Carousel */}
            <div className="bg-gray-800 border-y border-gray-700">
              <div className="container mx-auto px-4 py-6">
                <div className="relative h-[30rem] rounded-lg overflow-hidden">
                  <img
                    src={property.images && property.images.length > 0 ? property.images[activeImageIndex] : placeholderImage}
                    alt={`${property.name} - Image ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain bg-gray-900"
                  />
                  
                  {property.images && property.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                        aria-label="Previous image"
                      >
                        <FaChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                        aria-label="Next image"
                      >
                        <FaChevronRight size={20} />
                      </button>
                      
                      {/* Image counter */}
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm">
                        {activeImageIndex + 1} / {property.images.length}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Thumbnail gallery */}
                {property.images && property.images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {property.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-16 rounded-md overflow-hidden border-2 ${
                          activeImageIndex === index ? 'border-amber-500' : 'border-transparent'
                        }`}
                      >
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Property Details */}
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content */}
                <div className="lg:w-2/3">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
                    
                    <div className="flex items-center text-gray-300 mb-4">
                      <FaMapMarkerAlt className="mr-2 text-amber-500" />
                      <span>
                        {property.address.street}, {property.address.city}, {property.address.state} {property.address.zipCode}, {property.address.country}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i}
                              className={i < Math.round(calculateAverageRating()) ? "text-amber-400" : "text-gray-600"}
                              size={16}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm ml-2">
                          ({property.reviews?.length || 0} reviews)
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <FaBed className="mr-2 text-amber-500" />
                        <span>{stats.total} rooms total</span>
                      </div>
                      
                      <div className="flex items-center text-gray-300">
                        <FaCheckCircle className="mr-2 text-green-500" />
                        <span>{stats.vacant + stats.available} rooms available</span>
                      </div>
                    </div>
                    
                    {/* Property description */}
                    {property.description && (
                      <div className="bg-gray-800 p-6 rounded-lg mb-8">
                        <h2 className="text-xl font-semibold mb-4">About this property</h2>
                        <p className="text-gray-300 whitespace-pre-line">{property.description}</p>
                      </div>
                    )}
                    
                    {/* Property amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Property Amenities</h2>
                        <div className="bg-gray-800 p-6 rounded-lg">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {property.amenities.map((amenity, index) => (
                              <div key={index} className="flex items-center">
                                {amenityIcons[amenity] || (
                                  <FaCheckCircle className="text-amber-400 mr-2" />
                                )}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Room Availability */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Available Rooms</h2>
                        <Link
                          to={`/rooms?property=${propertyId}`}
                          className="text-amber-400 hover:text-amber-300"
                        >
                          View all rooms
                        </Link>
                      </div>
                      
                      {rooms && rooms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {rooms
                            .filter(room => room.status === 'vacant' || room.status === 'available')
                            .slice(0, 4)
                            .map(room => (
                              <Link
                                key={room._id}
                                to={`/rooms/${room._id}`}
                                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-amber-500 transition-colors group"
                              >
                                <div className="flex h-32">
                                  <div className="w-1/3">
                                    <img
                                      src={room.images && room.images.length > 0 ? room.images[0] : placeholderImage}
                                      alt={`Room ${room.roomNumber}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="w-2/3 p-4">
                                    <div className="flex justify-between">
                                      <h3 className="font-semibold group-hover:text-amber-400 transition-colors">
                                        {room.roomId || `Room ${room.roomNumber}`}
                                      </h3>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        room.status === 'vacant' ? 'bg-green-600 text-white' : 
                                        room.status === 'available' ? 'bg-blue-600 text-white' : 
                                        'bg-gray-600 text-white'
                                      }`}>
                                        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                                      </span>
                                    </div>
                                    
                                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-300">
                                      <div className="flex items-center">
                                        <FaUserFriends className="mr-1" />
                                        <span>{room.occupants?.length || 0}/{room.capacity || 1}</span>
                                      </div>
                                      
                                      {room.size && room.size.area && (
                                        <div className="flex items-center">
                                          <FaRulerCombined className="mr-1" />
                                          <span>{room.size.area} {room.size.unit}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="mt-2 text-amber-400 font-semibold">
                                      {formatPrice(room.price)}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                        </div>
                      ) : (
                        <div className="bg-gray-800 p-6 rounded-lg text-center">
                          <p className="text-gray-300">No rooms available at this time.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Location</h2>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <div className="h-64 bg-gray-700 rounded-lg overflow-hidden mb-4">
                          {/* Map placeholder - replace with actual map component */}
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <div className="text-center">
                              <FaMapMarkerAlt className="text-amber-500 mx-auto text-3xl mb-2" />
                              <p className="text-gray-300">
                                {property.address.street}, {property.address.city}, {property.address.state}
                              </p>
                              <p className="text-sm text-gray-400 mt-2">
                                Map view will be displayed here
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300">
                          {property.address.street}, {property.address.city}, {property.address.state} {property.address.zipCode}, {property.address.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar */}
                <div className="lg:w-1/3">
                  <div className="bg-gray-800 rounded-lg p-6 shadow-lg sticky top-24">
                    <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                    
                    <div className="space-y-4 mb-6">
                      {property.contactInfo?.phone && (
                        <div className="flex items-start">
                          <FaPhone className="text-amber-500 mr-3 mt-1" />
                          <div>
                            <p className="font-medium">Phone</p>
                            <a
                              href={`tel:${property.contactInfo.phone}`}
                              className="text-amber-400 hover:text-amber-300"
                            >
                              {property.contactInfo.phone}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {property.contactInfo?.email && (
                        <div className="flex items-start">
                          <FaEnvelope className="text-amber-500 mr-3 mt-1" />
                          <div>
                            <p className="font-medium">Email</p>
                            <a
                              href={`mailto:${property.contactInfo.email}`}
                              className="text-amber-400 hover:text-amber-300"
                            >
                              {property.contactInfo.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-700 pt-6">
                      <h4 className="font-medium mb-4">Room Availability</h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Rooms:</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Vacant Rooms:</span>
                          <span className="font-medium text-green-500">{stats.vacant}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Available Rooms:</span>
                          <span className="font-medium text-blue-500">{stats.available}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Full Rooms:</span>
                          <span className="font-medium text-red-500">{stats.full}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Link
                        to={`/rooms?property=${propertyId}`}
                        className="block w-full py-3 bg-amber-500 hover:bg-amber-600 text-center rounded-lg font-semibold transition-colors"
                      >
                        Browse Available Rooms
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gray-800 p-6 rounded-lg max-w-3xl mx-auto text-center">
              <h3 className="text-xl font-bold mb-3">Property Not Found</h3>
              <p className="text-gray-300 mb-6">
                The property you're looking for doesn't exist or has been removed.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={goBack}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white flex items-center"
                >
                  <FaArrowLeft className="mr-2" /> Go Back
                </button>
                <Link
                  to="/properties"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-md text-white"
                >
                  Browse All Properties
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default PropertyDetailPage;