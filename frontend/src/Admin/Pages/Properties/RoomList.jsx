import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBed, FaUsers, FaFilter, FaUserFriends } from 'react-icons/fa';
import axios from 'axios';
import AddRoomModal from '../../Components/Properties/AddRoomModal';
import TenantManagementModal from '../../Components/Tenants/TenantManagementModal';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const RoomList = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenantModalData, setTenantModalData] = useState(null);
  
  // Fetch property data and rooms
  useEffect(() => {
    const fetchPropertyAndRooms = async () => {
      try {
        setLoading(true);
        
        // Fetch property data
        const propertyResponse = await axios.get(`${API_URL}/properties/${propertyId}`);
        
        // Fetch rooms for this property
        const roomsResponse = await axios.get(`${API_URL}/properties/${propertyId}/rooms`);
        
        // Format the rooms data
        const formattedRooms = roomsResponse.data.data.rooms.map(room => ({
          id: room._id,
          _id: room._id,  // <-- Add this line to preserve the original MongoDB ID
          roomId: room.roomId,
          roomNumber: room.roomNumber,
          images: room.images && room.images.length ? room.images : ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg=='],
          capacity: room.capacity || 1,
          currentOccupants: room.occupants || [],
          status: room.status || 'vacant',
          facilities: room.facilities || [],
          price: room.price || { amount: 0, currency: 'PHP', period: 'monthly' },
          description: room.description || '',
          size: room.size || { area: '', unit: 'sqm' }
        }));
        
        setProperty({
          id: propertyResponse.data.data.property._id,
          name: propertyResponse.data.data.property.name,
          address: `${propertyResponse.data.data.property.address.street}, ${propertyResponse.data.data.property.address.city}`,
          description: propertyResponse.data.data.property.description
        });
        
        setRooms(formattedRooms);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchPropertyAndRooms();
  }, [propertyId]);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/rooms/${id}`);
        setRooms(rooms.filter(room => room.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete room.');
      }
    }
  };
  
  const handleEdit = (id) => {
    // Navigate to the room details page where editing can be done
    navigate(`/admin/rooms/${id}`);
  };
  
  const handleAddRoom = async (roomData) => {
    try {
      const response = await axios.post(`${API_URL}/rooms`, {
        ...roomData,
        property: propertyId
      });
      
      const newRoom = response.data.data.room;
      
      // Format the new room to match component state structure
      const formattedRoom = {
        id: newRoom._id,
        roomId: newRoom.roomId,
        roomNumber: newRoom.roomNumber,
        images: newRoom.images || [],
        capacity: newRoom.capacity || 1,
        currentOccupants: newRoom.occupants || [],
        status: newRoom.status || 'vacant',
        facilities: newRoom.facilities || [],
        price: newRoom.price || { amount: 0, currency: 'PHP', period: 'monthly' },
        description: newRoom.description || '',
        size: newRoom.size || { area: '', unit: 'sqm' }
      };
      
      setRooms([...rooms, formattedRoom]);
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add room.');
    }
  };
  
  const refreshRooms = async () => {
    try {
      // Fetch rooms for this property
      const roomsResponse = await axios.get(`${API_URL}/properties/${propertyId}/rooms`);
      
      // Format the rooms data
      const formattedRooms = roomsResponse.data.data.rooms.map(room => ({
        id: room._id,
        roomId: room.roomId,
        roomNumber: room.roomNumber,
        images: room.images && room.images.length ? room.images : ['default-placeholder-image-url'],
        capacity: room.capacity || 1,
        occupants: room.occupants || [],
        status: room.status || 'vacant',
        facilities: room.facilities || [],
        price: room.price || { amount: 0, currency: 'PHP', period: 'monthly' },
        description: room.description || '',
        size: room.size || { area: '', unit: 'sqm' }
      }));
      
      setRooms(formattedRooms);
    } catch (err) {
      console.error('Error refreshing rooms:', err);
    }
  };
  
  const filteredRooms = rooms.filter(room => {
    // Apply text search
    const matchesSearch = 
      room.roomId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-lg">
        <h3 className="text-xl font-bold">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{property.name}: Rooms</h1>
          <p className="text-gray-400">{property.address}</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mt-4 md:mt-0"
        >
          Back to Properties
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search rooms..."
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-gray-700 border border-gray-600 text-white pl-10 pr-8 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="vacant">Vacant</option>
              <option value="available">Available</option>
              <option value="full">Full</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
          </div>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> Add Room
          </button>
        </div>
      </div>
      
      {/* Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <div className="h-48 overflow-hidden relative">
              <img 
                src={room.images[0]} 
                alt={room.roomId} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
              <div className={`
                absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium
                ${room.status === 'vacant' ? 'bg-gray-500 text-white' : ''}
                ${room.status === 'available' ? 'bg-green-500 text-white' : ''}
                ${room.status === 'full' ? 'bg-red-500 text-white' : ''}
                ${room.status === 'maintenance' ? 'bg-yellow-500 text-white' : ''}
              `}>
                {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-white">{room.roomId || `Room ${room.roomNumber}`}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(room.id)}
                    className="text-blue-400 hover:text-blue-300 focus:outline-none"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(room.id)}
                    className="text-red-400 hover:text-red-300 focus:outline-none"
                  >
                    <FaTrash />
                  </button>
                  <button 
                    onClick={() => setTenantModalData({
                      id: room.id,
                      name: room.roomId || `Room ${room.roomNumber}`
                    })}
                    className="text-purple-400 hover:text-purple-300 focus:outline-none"
                    title="Manage Tenants"
                  >
                    <FaUserFriends />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center mt-2 text-gray-400 text-sm">
                <FaBed className="mr-1" /> Room {room.roomNumber}
                <span className="mx-2">•</span>
                <FaUserFriends className="mr-1" /> {room.currentOccupants.length}/{room.capacity}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center">
                  <FaUsers className="text-gray-400 mr-2" />
                  <span className="text-gray-300">
                    {room.currentOccupants.length}/{room.capacity} Occupants
                  </span>
                </div>
                <span className="text-white font-semibold">
                  LKR:{room.price?.amount?.toLocaleString() || 0}
                  <span className="text-gray-400 text-sm">/{room.price?.period || 'monthly'}</span>
                </span>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {room.facilities.slice(0, 3).map((facility, i) => (
                  <span 
                    key={i} 
                    className="bg-gray-700 text-gray-300 px-2 py-1 rounded-md text-xs"
                  >
                    {facility}
                  </span>
                ))}
                {room.facilities.length > 3 && (
                  <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-md text-xs">
                    +{room.facilities.length - 3} more
                  </span>
                )}
              </div>
              
              <div className="mt-5 pt-4 border-t border-gray-700">
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                  onClick={() => navigate(`/admin/rooms/${room._id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredRooms.length === 0 && (
        <div className="text-center py-10 bg-gray-900 rounded-lg">
          <p className="text-gray-400 text-lg">No rooms found matching your criteria.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add your first room
          </button>
        </div>
      )}
      
      {/* Add Room Modal */}
      <AddRoomModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        propertyId={propertyId}
        propertyName={property.name}
        onAddRoom={handleAddRoom}
      />
      
      {tenantModalData && (
        <TenantManagementModal 
          isOpen={!!tenantModalData}
          onClose={() => setTenantModalData(null)}
          roomId={tenantModalData.id}
          roomName={tenantModalData.name}
          onUpdate={refreshRooms}
        />
      )}
    </div>
  );
};

export default RoomList;