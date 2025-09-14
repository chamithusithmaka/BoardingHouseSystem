import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaEdit, FaTrash, FaBed, FaUsers, 
  FaDollarSign, FaRulerCombined, FaSave, FaTimesCircle,
  FaImages, FaUserFriends, FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import ConfirmDialog from '../../Components/Common/ConfirmDialog';
import ImageGallery from '../../Components/Common/ImageGallery';
import TenantManagementModal from '../../Components/Tenants/TenantManagementModal';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const RoomDetails = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  
  // Fetch room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        // Check if roomId is undefined or invalid
        if (!roomId || roomId === 'undefined') {
          setError('Invalid room ID. Please go back and select a valid room.');
          setLoading(false);
          return;
        }

        setLoading(true);
        
        try {
          console.log(`Fetching room with ID: ${roomId}`);
          const response = await axios.get(`${API_URL}/rooms/${roomId}`);
          
          if (response.data.status !== 'success' || !response.data.data.room) {
            throw new Error('Invalid response format');
          }
          
          const roomData = response.data.data.room;
          console.log('Room data received:', roomData);
          
          setRoom(roomData);
          
          // Set default edit data
          setEditData({
            roomNumber: roomData.roomNumber || '',
            description: roomData.description || '',
            capacity: roomData.capacity || 1,
            status: roomData.status || 'vacant',
            facilities: roomData.facilities || [],
            price: roomData.price || { 
              amount: 0, 
              currency: 'PHP', 
              period: 'monthly' 
            },
            size: roomData.size || { 
              area: '', 
              unit: 'sqm' 
            },
            images: roomData.images || []
          });
          
          // Handle property data
          if (roomData.property) {
            if (typeof roomData.property === 'object') {
              console.log('Property data from room:', roomData.property);
              setProperty(roomData.property);
            } else if (typeof roomData.property === 'string') {
              try {
                console.log(`Fetching property with ID: ${roomData.property}`);
                const propertyResponse = await axios.get(`${API_URL}/properties/${roomData.property}`);
                if (propertyResponse.data.status === 'success') {
                  console.log('Property data from API:', propertyResponse.data.data.property);
                  setProperty(propertyResponse.data.data.property);
                }
              } catch (propErr) {
                console.error('Error fetching property data:', propErr);
                // Don't fail the entire component if just property data fails
              }
            }
          }
        } catch (err) {
          console.error('Error fetching room data:', err);
          
          // Handle specific error responses
          if (err.response) {
            if (err.response.status === 400) {
              setError('Invalid room ID format. Please check the URL and try again.');
            } else if (err.response.status === 404) {
              setError('Room not found. It may have been deleted or moved.');
            } else {
              setError(err.response?.data?.message || 'Failed to load room data');
            }
          } else if (err.request) {
            // The request was made but no response was received
            setError('Unable to connect to the server. Please check your internet connection.');
          } else {
            // Something happened in setting up the request
            setError('An unexpected error occurred');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error in fetchRoomData:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };
    
    fetchRoomData();
  }, [roomId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;

    // For price.amount: only allow positive numbers, no minus, no special chars
    if (name === 'price.amount') {
      // Remove any character that is not a digit or dot
      let sanitized = value.replace(/[^0-9.]/g, '');
      // Prevent multiple dots
      sanitized = sanitized.replace(/(\..*)\./g, '$1');
      // Prevent leading zeros unless it's "0."
      if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
        sanitized = sanitized.replace(/^0+/, '');
      }
      setEditData({
        ...editData,
        price: {
          ...editData.price,
          amount: sanitized
        }
      });
      return;
    }

    // For size.area: only allow digits, no minus, no special chars, no dot
    if (name === 'size.area') {
      let sanitized = value.replace(/[^0-9]/g, '');
      // Prevent leading zeros
      if (sanitized.length > 1 && sanitized[0] === '0') {
        sanitized = sanitized.replace(/^0+/, '');
      }
      setEditData({
        ...editData,
        size: {
          ...editData.size,
          area: sanitized
        }
      });
      return;
    }

    // Default handler
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditData({
        ...editData,
        [parent]: {
          ...editData[parent],
          [child]: value
        }
      });
    } else if (name === 'capacity') {
      setEditData({
        ...editData,
        [name]: parseInt(value) || 1
      });
    } else {
      setEditData({
        ...editData,
        [name]: value
      });
    }
  };
  
  const handleFacilityToggle = (facility) => {
    if (editData.facilities.includes(facility)) {
      setEditData({
        ...editData,
        facilities: editData.facilities.filter(f => f !== facility)
      });
    } else {
      setEditData({
        ...editData,
        facilities: [...editData.facilities, facility]
      });
    }
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    const readAndConvertImage = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    };

    Promise.all(files.map(file => readAndConvertImage(file)))
      .then(base64Images => {
        setEditData({
          ...editData,
          images: [...(room.images || []), ...base64Images]
        });
        setUploading(false);
      })
      .catch(error => {
        console.error('Error converting images to base64:', error);
        setUploading(false);
      });
  };
  
  const removeImage = (index) => {
    const updatedImages = [...(editData.images || room.images || [])];
    updatedImages.splice(index, 1);
    setEditData({
      ...editData,
      images: updatedImages
    });
    
    // Reset active image if needed
    if (activeImageIndex >= updatedImages.length) {
      setActiveImageIndex(Math.max(0, updatedImages.length - 1));
    }
  };
  
  const handleSave = async () => {
    try {
      const response = await axios.patch(`${API_URL}/rooms/${roomId}`, editData);
      setRoom(response.data.data.room);
      setIsEditing(false);
      alert('Room updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update room');
    }
  };
  
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/rooms/${roomId}`);
      alert('Room deleted successfully');
      setShowDeleteDialog(false);
      
      // Navigate back to the property rooms page
      if (room.property && typeof room.property === 'object') {
        navigate(`/admin/properties/${room.property._id}/rooms`);
      } else if (room.property) {
        navigate(`/admin/properties/${room.property}/rooms`);
      } else {
        navigate('/admin/properties');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room. It may have occupants assigned to it.');
      setShowDeleteDialog(false);
    }
  };
  
  const refreshRoomData = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomId}`);
      setRoom(response.data.data.room);
    } catch (err) {
      console.error('Error refreshing room data:', err);
    }
  };
  
  const facilityOptions = [
    'Air Conditioning', 'Private Bathroom', 'Desk', 'Closet', 
    'Window', 'TV', 'Internet', 'Fan', 'Hot Water'
  ];
  
  // Calculate the real status based on occupancy rather than using the stored value
  const getRealStatus = (room) => {
    if (!room.occupants || room.occupants.length === 0) {
      return 'vacant';
    } else if (room.occupants.length >= room.capacity) {
      return 'full';
    } else if (room.occupants.length > 0) {
      return 'available';
    } else {
      return 'vacant';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-800/30 text-white p-6 rounded-lg border border-red-700">
        <div className="flex items-center mb-4">
          <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
          <h3 className="text-xl font-bold">Error Loading Room Details</h3>
        </div>
        <p className="text-gray-300 mb-4">{error}</p>
        <div className="flex gap-3">
          <button 
            onClick={() => window.history.back()} 
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Go Back
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!room) return null;
  
  // Get active image
  const images = room.images || [];
  const activeImage = images.length > 0 ? images[activeImageIndex] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==';
  
  return (
    <div className="container mx-auto px-4">
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center text-blue-400 hover:text-blue-300"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave} 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FaSave className="mr-2" /> Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FaTimesCircle className="mr-2" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FaEdit className="mr-2" /> Edit Room
              </button>
              <button 
                onClick={handleDelete} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FaTrash className="mr-2" /> Delete
              </button>
              <button 
                onClick={() => setShowTenantModal(true)} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <FaUserFriends className="mr-2" /> Manage Tenants
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Images and property info */}
          <div>
            {/* Main image */}
            <div className="h-72 overflow-hidden cursor-pointer" onClick={() => setShowGallery(true)}>
              <img 
                src={activeImage} 
                alt={`Room ${room.roomNumber}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                  <FaImages className="inline mr-1" /> {images.length} photos
                </div>
              )}
            </div>
            
            {/* Image thumbnails */}
            {images.length > 0 && (
              <div className="flex overflow-x-auto p-2 gap-2 bg-gray-800">
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 ${activeImageIndex === index ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <img 
                      src={image} 
                      alt={`Room thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Property info */}
            {property && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Property Information</h3>
                <div className="flex flex-col gap-1">
                  <p className="text-gray-300">
                    <span className="font-medium">Name:</span> {property.name}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Address:</span> {property.address.street}, {property.address.city}, {property.address.state} {property.address.zipCode}
                  </p>
                  {property.contactInfo && (
                    <div className="text-gray-300">
                      <span className="font-medium">Contact:</span>{' '}
                      {property.contactInfo.phone && <span className="mr-2">{property.contactInfo.phone}</span>}
                      {property.contactInfo.email && <span>{property.contactInfo.email}</span>}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => navigate(`/admin/properties/${property._id || property}/rooms`)} 
                  className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                >
                  View all rooms in this property
                </button>
              </div>
            )}
          </div>
          
          {/* Right side: Room details */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-white">
                {room.roomId || `Room ${room.roomNumber}`}
              </h1>
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${getRealStatus(room) === 'vacant' ? 'bg-gray-500 text-white' : ''}
                ${getRealStatus(room) === 'available' ? 'bg-green-500 text-white' : ''}
                ${getRealStatus(room) === 'full' ? 'bg-red-500 text-white' : ''}
                ${getRealStatus(room) === 'maintenance' ? 'bg-yellow-500 text-white' : ''}
              `}>
                {getRealStatus(room).charAt(0).toUpperCase() + getRealStatus(room).slice(1)}
              </div>
            </div>
            
            {isEditing ? (
              // Edit Form
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-1">Room Number</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={editData.roomNumber}
                    onChange={handleChange}
                    onKeyDown={e => /[^a-zA-Z0-9]/.test(e.key) && e.preventDefault()}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Room Number"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Capacity</label>
                    <input
                      type="number"
                      name="capacity"
                      min="1"
                      value={editData.capacity}
                      onChange={handleChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Status</label>
                    <select
                      name="status"
                      value={editData.status}
                      onChange={handleChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="vacant">Vacant</option>
                      <option value="available">Available</option>
                      <option value="full">Full</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Price Amount</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"></span>
                      <input
                        type="number"
                        name="price.amount"
                        value={editData.price.amount}
                        onKeyDown={(e) => (e.key === 'e' || e.key === '-' || e.key === '+') && e.preventDefault()}
                        onChange={handleChange}
                        className="w-full p-2 pl-8 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Period</label>
                    <select
                      name="price.period"
                      value={editData.price.period}
                      onChange={handleChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Size</label>
                    <input
                      type="text"
                      name="size.area"
                      value={editData.size.area}
                      onChange={handleChange}
                      onKeyDown={(e) => (e.key === 'e' || e.key === '-' || e.key === '+') && e.preventDefault()}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="e.g. 12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 mb-1">Unit</label>
                    <select
                      name="size.unit"
                      value={editData.size.unit}
                      onChange={handleChange}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="sqm">Square Meters</option>
                      <option value="sqft">Square Feet</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Room Images</label>
                  <div className="mb-2">
                    <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg flex items-center inline-flex">
                      <FaEdit className="mr-2" />
                      {uploading ? "Uploading..." : "Add Images"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(editData.images || room.images || []).map((image, index) => (
                      <div key={index} className="relative h-20 group">
                        <img
                          src={image}
                          alt={`Room ${index + 1}`}
                          className="h-full w-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTimesCircle size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Facilities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {facilityOptions.map((facility) => (
                      <div 
                        key={facility}
                        className={`
                          p-2 rounded-lg cursor-pointer border text-center text-sm
                          ${editData.facilities.includes(facility) 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}
                        `}
                        onClick={() => handleFacilityToggle(facility)}
                      >
                        {facility}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Display Room Details
              <>
                <div className="mb-4 text-gray-400 text-sm">
                  <FaBed className="inline-block mr-1" /> Room {room.roomNumber}
                </div>
                
                {room.description && (
                  <div className="mb-6 text-gray-300">{room.description}</div>
                )}
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-1">
                      <FaUsers className="mr-2" /> Capacity
                    </div>
                    <div className="text-xl font-medium text-white">{room.capacity} {room.capacity > 1 ? 'Persons' : 'Person'}</div>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-1">
                      <FaDollarSign className="mr-2" /> Price
                    </div>
                    <div className="text-xl font-medium text-white">
                      {room.price?.amount?.toLocaleString() || 0}
                      <span className="text-gray-400 text-sm">/{room.price?.period || 'monthly'}</span>
                    </div>
                  </div>
                </div>
                
                {room.size && room.size.area && (
                  <div className="mb-6">
                    <div className="flex items-center text-gray-400 mb-1">
                      <FaRulerCombined className="mr-2" /> Room Size
                    </div>
                    <div className="text-white">{room.size.area} {room.size.unit || 'sqm'}</div>
                  </div>
                )}
                
                {room.facilities && room.facilities.length > 0 && (
                  <div className="mb-6">
                    <div className="text-gray-400 mb-2">Facilities</div>
                    <div className="flex flex-wrap gap-2">
                      {room.facilities.map((facility, index) => (
                        <span key={index} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-md text-sm">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <div className="text-gray-400 mb-2">Occupancy Status</div>
                  <div className="h-2 bg-gray-700 rounded-full mb-2">
                    <div 
                      className="h-2 bg-blue-600 rounded-full" 
                      style={{ width: `${(room.occupants?.length || 0) / room.capacity * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-white">
                    {room.occupants?.length || 0} of {room.capacity} occupants
                  </div>
                </div>
                
                {room.occupants && room.occupants.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-gray-400">Current Occupants</div>
                      <button
                        onClick={() => setShowTenantModal(true)}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Manage
                      </button>
                    </div>
                    <div className="space-y-2">
                      {room.occupants.slice(0, 3).map((tenant) => (
                        <div key={tenant._id} className="flex items-center bg-gray-800 p-2 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden mr-3">
                            {tenant.photo ? (
                              <img 
                                src={tenant.photo} 
                                alt={tenant.name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400">{tenant.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="text-white">{tenant.name}</div>
                        </div>
                      ))}
                      {room.occupants.length > 3 && (
                        <div className="text-gray-400 text-center text-sm">
                          +{room.occupants.length - 3} more occupants
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone and any associated data will be lost."
      />
      
      {/* Image gallery */}
      {showGallery && (
        <ImageGallery 
          images={room.images || []} 
          onClose={() => setShowGallery(false)} 
        />
      )}
      
      {/* Tenant management modal */}
      {showTenantModal && (
        <TenantManagementModal 
          isOpen={showTenantModal}
          onClose={() => setShowTenantModal(false)}
          roomId={roomId}
          roomName={room.roomId || `Room ${room.roomNumber}`}
          onUpdate={refreshRoomData}
        />
      )}
    </div>
  );
};

export default RoomDetails;