import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaMapMarkerAlt, FaUsers, FaRulerCombined, FaCoins, 
  FaCalendarAlt, FaArrowLeft, FaCheckCircle, FaTimesCircle,
  FaWifi, FaBath, FaSnowflake, FaTv, FaWater, FaShower, FaClock,
  FaBed, FaChair, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';
import { useAuth } from '../../Context/AuthContext';
import RoomRequestForm from './RoomRequestForm';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Map facility icons
const facilityIcons = {
  'WiFi': <FaWifi className="text-amber-500" />,
  'Private Bathroom': <FaBath className="text-amber-500" />,
  'Air Conditioning': <FaSnowflake className="text-amber-500" />,
  'TV': <FaTv className="text-amber-500" />,
  'Hot Water': <FaWater className="text-amber-500" />,
  'Shower': <FaShower className="text-amber-500" />,
  'Internet': <FaWifi className="text-amber-500" />,
  '24/7 Access': <FaClock className="text-amber-500" />,
  'Bed': <FaBed className="text-amber-500" />,
  'Furniture': <FaChair className="text-amber-500" />
};

// Generate placeholder icons for facilities without specific icons
const getFacilityIcon = (facility) => {
  return facilityIcons[facility] || <FaCheckCircle className="text-amber-500" />;
};

const RoomDetailPage = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [room, setRoom] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedRooms, setRelatedRooms] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        
        // Get room details
        const roomResponse = await axios.get(`${API_URL}/rooms/${roomId}`);
        const roomData = roomResponse.data.data.room;
        setRoom(roomData);
        
        // Get property details
        const propertyId = roomData.property._id || roomData.property;
        const propertyResponse = await axios.get(`${API_URL}/properties/${propertyId}`);
        const propertyData = propertyResponse.data.data.property;
        setProperty(propertyData);
        
        // Get other rooms from the same property (for related rooms section)
        const relatedRoomsResponse = await axios.get(`${API_URL}/properties/${propertyId}/rooms`);
        const relatedRoomsData = relatedRoomsResponse.data.data.rooms
          .filter(r => r._id !== roomId && (r.status === 'vacant' || r.status === 'available'))
          .slice(0, 3); // Limit to 3 related rooms
        setRelatedRooms(relatedRoomsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching room details:', err);
        setError('Failed to load room details. Please try again later.');
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomDetails();
    }
    
    // Reset active image index when room changes
    setActiveImageIndex(0);
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [roomId]);

  // Handle image navigation
  const nextImage = () => {
    if (room && room.images && room.images.length > 0) {
      setActiveImageIndex((prevIndex) => 
        prevIndex === room.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (room && room.images && room.images.length > 0) {
      setActiveImageIndex((prevIndex) => 
        prevIndex === 0 ? room.images.length - 1 : prevIndex - 1
      );
    }
  };
  
  const handleRequestRoom = () => {
    setShowRequestForm(true);
  };

  const goBack = () => {
    navigate(-1);
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return 'Price not specified';
    
    return `LKR:${price.amount.toLocaleString()} / ${price.period}`;
  };

  // Generate a placeholder image if no images are available
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==';

  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white pb-12">
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
        ) : room ? (
          <>
            {/* Back button */}
            <div className="container mx-auto px-4 py-4">
              <button
                onClick={goBack}
                className="flex items-center text-gray-400 hover:text-amber-400 transition-colors"
              >
                <FaArrowLeft className="mr-1" /> Back
              </button>
            </div>
            
            {/* Room Photos Carousel */}
            <div className="bg-gray-800 border-y border-gray-700">
              <div className="container mx-auto px-4 py-6">
                <div className="relative h-[30rem] rounded-lg overflow-hidden">
                  <img
                    src={room.images && room.images.length > 0 ? room.images[activeImageIndex] : placeholderImage}
                    alt={`Room ${room.roomNumber} - Image ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain bg-gray-900"
                  />
                  
                  {room.images && room.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                      >
                        <FaChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                      >
                        <FaChevronRight size={20} />
                      </button>
                      
                      {/* Image counter */}
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm">
                        {activeImageIndex + 1} / {room.images.length}
                      </div>
                    </>
                  )}
                  
                  {/* Room status badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`
                      px-3 py-1 rounded-md text-white font-medium
                      ${room.status === 'vacant' ? 'bg-green-500' : ''}
                      ${room.status === 'available' ? 'bg-blue-500' : ''}
                      ${room.status === 'full' ? 'bg-red-500' : ''}
                      ${room.status === 'maintenance' ? 'bg-yellow-500' : ''}
                    `}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                {/* Thumbnail gallery */}
                {room.images && room.images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {room.images.map((image, index) => (
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
            
            {/* Room Details */}
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main content */}
                <div className="lg:w-2/3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        {room.roomId || `Room ${room.roomNumber}`}
                      </h1>
                      {property && (
                        <div className="flex items-center text-gray-300 mb-2">
                          <FaMapMarkerAlt className="mr-2 text-amber-500" />
                          <span>{property.name}, {property.address.street}, {property.address.city}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <div className="text-2xl font-bold text-amber-400">
                        {formatPrice(room.price)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Room specifications */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FaUsers className="text-amber-500 mr-2" />
                        <span className="text-gray-300">Capacity</span>
                      </div>
                      <p className="text-lg font-semibold">{room.occupants.length} / {room.capacity} Persons</p>
                    </div>
                    
                    {room.size && room.size.area && (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <FaRulerCombined className="text-amber-500 mr-2" />
                          <span className="text-gray-300">Size</span>
                        </div>
                        <p className="text-lg font-semibold">{room.size.area} {room.size.unit}</p>
                      </div>
                    )}
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FaCoins className="text-amber-500 mr-2" />
                        <span className="text-gray-300">Payment</span>
                      </div>
                      <p className="text-lg font-semibold capitalize">{room.price?.period || 'Monthly'}</p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FaCalendarAlt className="text-amber-500 mr-2" />
                        <span className="text-gray-300">Availability</span>
                      </div>
                      <p className="text-lg font-semibold">{room.status === 'vacant' ? 'Immediate' : 'Limited'}</p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {room.description && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Description</h2>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <p className="text-gray-300 whitespace-pre-line">{room.description}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Facilities */}
                  {room.facilities && room.facilities.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Facilities & Amenities</h2>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {room.facilities.map((facility, index) => (
                            <div key={index} className="flex items-center">
                              <div className="mr-3">
                                {getFacilityIcon(facility)}
                              </div>
                              <span>{facility}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Property Description */}
                  {property && property.description && (
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">About the Property</h2>
                      <div className="bg-gray-800 p-6 rounded-lg">
                        <h3 className="font-semibold text-amber-400 mb-2">{property.name}</h3>
                        <p className="text-gray-300">{property.description}</p>
                        
                        {/* Property amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Property Amenities:</h4>
                            <div className="flex flex-wrap gap-2">
                              {property.amenities.map((amenity, index) => (
                                <span 
                                  key={index} 
                                  className="px-3 py-1 bg-gray-700 rounded-full text-sm"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <Link 
                            to={`/properties/${property._id}`} 
                            className="text-amber-400 hover:underline flex items-center"
                          >
                            View more about this property 
                            <FaChevronRight className="ml-1" size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sidebar - Booking/Request Section */}
                <div className="lg:w-1/3">
                  <div className="bg-gray-800 rounded-lg p-6 shadow-lg sticky top-24">
                    <h3 className="text-xl font-semibold mb-4">Interested in this room?</h3>
                    
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Room ID:</span>
                        <span className="font-medium">{room.roomId || `Room ${room.roomNumber}`}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Status:</span>
                        <span className="font-medium capitalize">{room.status}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Price:</span>
                        <span className="font-medium">{formatPrice(room.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Available Slots:</span>
                        <span className="font-medium">
                          {room.capacity - room.occupants.length} of {room.capacity}
                        </span>
                      </div>
                    </div>
                    
                    {room.status !== 'full' ? (
                      <>
                        {isAuthenticated ? (
                          <button
                            onClick={handleRequestRoom}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 rounded-lg font-semibold transition-colors flex items-center justify-center"
                          >
                            Request This Room
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <Link
                              to="/login"
                              className="block w-full py-3 bg-amber-500 hover:bg-amber-600 rounded-lg font-semibold transition-colors text-center"
                            >
                              Sign In to Request Room
                            </Link>
                            <div className="text-center text-sm text-gray-400">
                              No account yet? <Link to="/register" className="text-amber-400 hover:underline">Register</Link> to book rooms
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 flex items-start bg-gray-700/50 rounded-lg p-4">
                          <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                          <p className="text-sm text-gray-300">
                            Request this room and our admin will review your application. 
                            You'll be notified once your request is approved.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center bg-red-900/30 border border-red-800 text-red-100 p-4 rounded-lg">
                        <FaTimesCircle className="mr-2" />
                        <span>This room is currently full</span>
                      </div>
                    )}
                    
                    {/* Contact information */}
                    <div className="mt-6 border-t border-gray-700 pt-6">
                      <h4 className="font-medium mb-3">Need more information?</h4>
                      <div className="flex flex-col space-y-2">
                        <a 
                          href="tel:+639123456789"
                          className="text-amber-400 hover:text-amber-300"
                        >
                          +63 912 345 6789
                        </a>
                        <a 
                          href="mailto:info@boardinghouse.com"
                          className="text-amber-400 hover:text-amber-300"
                        >
                          info@boardinghouse.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Related Rooms */}
            {relatedRooms.length > 0 && (
              <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6">Other Available Rooms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedRooms.map(relatedRoom => (
                    <Link 
                      to={`/rooms/${relatedRoom._id}`}
                      key={relatedRoom._id} 
                      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={relatedRoom.images && relatedRoom.images.length > 0 
                            ? relatedRoom.images[0] 
                            : placeholderImage
                          } 
                          alt={`Room ${relatedRoom.roomNumber}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-5">
                        <h3 className="font-semibold text-lg mb-2">
                          {relatedRoom.roomId || `Room ${relatedRoom.roomNumber}`}
                        </h3>
                        
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-300">
                            <FaUsers className="inline mr-1" />
                            {relatedRoom.occupants.length} / {relatedRoom.capacity} Occupants
                          </span>
                          {relatedRoom.size && relatedRoom.size.area && (
                            <span className="text-gray-300">
                              {relatedRoom.size.area} {relatedRoom.size.unit}
                            </span>
                          )}
                        </div>
                        
                        {relatedRoom.facilities && relatedRoom.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {relatedRoom.facilities.slice(0, 3).map((facility, index) => (
                              <span 
                                key={index} 
                                className="text-xs px-2 py-1 bg-gray-700 rounded-md"
                              >
                                {facility}
                              </span>
                            ))}
                            {relatedRoom.facilities.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-700 rounded-md">
                                +{relatedRoom.facilities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                          <p className="font-bold text-amber-400">
                            LKR:{relatedRoom.price?.amount.toLocaleString()}
                            <span className="text-xs text-gray-400 font-normal"> / {relatedRoom.price?.period}</span>
                          </p>
                          <span className="bg-amber-500 text-white text-xs px-3 py-1 rounded-md">
                            View Details
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gray-800 p-6 rounded-lg max-w-3xl mx-auto text-center">
              <h3 className="text-xl font-bold mb-3">Room Not Found</h3>
              <p className="text-gray-300 mb-6">The room you're looking for doesn't exist or has been removed.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={goBack}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white flex items-center"
                >
                  <FaArrowLeft className="mr-2" /> Go Back
                </button>
                <Link
                  to="/rooms"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-md text-white"
                >
                  Browse All Rooms
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Room Request Form Modal */}
        {showRequestForm && room && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <RoomRequestForm 
                  room={{
                    id: room._id,
                    roomNumber: room.roomNumber,
                    roomId: room.roomId,
                    price: room.price,
                    capacity: room.capacity,
                    occupants: room.occupants,
                    propertyName: property?.name,
                    propertyAddress: property ? `${property.address.city}, ${property.address.state}` : ''
                  }}
                  onSuccess={() => {
                    setShowRequestForm(false);
                  }}
                  onCancel={() => {
                    setShowRequestForm(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default RoomDetailPage;