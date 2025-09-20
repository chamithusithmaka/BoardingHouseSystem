import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEllipsisV, FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddPropertyModal from '../../Components/Properties/AddPropertyModal';
import EditPropertyModal from '../../Components/Properties/EditPropertyModal';
import { ComprehensiveReportButton } from '../../../Components/Reports/PropertyReportGenerator';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const PropertyList = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [roomDataLoading, setRoomDataLoading] = useState({});
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/properties`);
        
        // Get additional room data for each property
        const propertiesWithRoomData = await Promise.all(
          response.data.data.properties.map(async (property) => {
            try {
              // Fetch rooms for this specific property
              const roomsResponse = await axios.get(`${API_URL}/properties/${property._id}/rooms`);
              const rooms = roomsResponse.data.data.rooms || [];
              
              // Calculate occupied rooms
              const occupiedRooms = rooms.filter(room => room.status === 'full').length;
              
              return {
                ...property,
                roomCount: rooms.length,
                occupiedRoomCount: occupiedRooms
              };
            } catch (err) {
              console.error(`Error fetching rooms for property ${property._id}:`, err);
              return {
                ...property,
                roomCount: 0,
                occupiedRoomCount: 0
              };
            }
          })
        );
        
        // Map API response to component state
        const formattedProperties = response.data.data.properties.map(property => ({
          id: property._id,
          name: property.name,
          address: `${property.address.street}, ${property.address.city}`,
          fullAddress: property.address,
          totalRooms: property.roomCount || 0,
          occupiedRooms: property.occupiedRoomCount || 0,
          image: property.images && property.images.length > 0 ? property.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==',
          amenities: property.amenities || [],
          description: property.description || '',
          contactInfo: property.contactInfo || {},
          images: property.images || [],
          rawData: property // Store the raw data for editing
        }));

        setProperties(formattedProperties);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch properties');
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleEdit = (property) => {
    setEditingProperty(property);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/properties/${id}`);
        setProperties(properties.filter(property => property.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete property. It may have rooms assigned to it.');
      }
    }
  };

  const handleAddProperty = async (newProperty) => {
    try {
      const response = await axios.post(`${API_URL}/properties`, newProperty);
      const addedProperty = response.data.data.property;
      
      // Format the new property to match the component state structure
      setProperties([...properties, {
        id: addedProperty._id,
        name: addedProperty.name,
        address: `${addedProperty.address.street}, ${addedProperty.address.city}`,
        fullAddress: addedProperty.address,
        totalRooms: 0,
        occupiedRooms: 0,
        image: addedProperty.images && addedProperty.images.length > 0 ? addedProperty.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM0QjU1NjMiLz48cGF0aCBkPSJNMzAwIDI1MEg1MDBWMzUwSDMwMFYyNTBaIiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTM1MCA0MDBINDUwVjUwMEgzNTBWNDAwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik0zMjUgMTUwSDQ3NUwyNzUgMzUwSDEyNUwzMjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjxwYXRoIGQ9Ik01MjUgMTUwSDY3NUw0NzUgMzUwSDMyNUw1MjUgMTUwWiIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==',
        amenities: addedProperty.amenities || [],
        description: addedProperty.description || '',
        contactInfo: addedProperty.contactInfo || {},
        images: addedProperty.images || [],
        rawData: addedProperty
      }]);
      
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add property');
    }
  };

  const handleUpdateProperty = (updatedProperty) => {
    // Update properties list with the updated property
    setProperties(properties.map(prop => 
      prop.id === updatedProperty._id ? {
        id: updatedProperty._id,
        name: updatedProperty.name,
        address: `${updatedProperty.address.street}, ${updatedProperty.address.city}`,
        fullAddress: updatedProperty.address,
        totalRooms: prop.totalRooms,
        occupiedRooms: prop.occupiedRooms,
        image: updatedProperty.images && updatedProperty.images.length > 0 ? 
          updatedProperty.images[0] : prop.image,
        amenities: updatedProperty.amenities || [],
        description: updatedProperty.description || '',
        contactInfo: updatedProperty.contactInfo || {},
        images: updatedProperty.images || [],
        rawData: updatedProperty
      } : prop
    ));
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const refreshRoomData = async (propertyId) => {
    try {
      setRoomDataLoading(prev => ({ ...prev, [propertyId]: true }));
      const roomsResponse = await axios.get(`${API_URL}/properties/${propertyId}/rooms`);
      const rooms = roomsResponse.data.data.rooms || [];
      const occupiedRooms = rooms.filter(room => room.status === 'full').length;
      
      setProperties(prev => prev.map(prop => 
        prop.id === propertyId ? {
          ...prop,
          totalRooms: rooms.length,
          occupiedRooms: occupiedRooms
        } : prop
      ));
      
      setRoomDataLoading(prev => ({ ...prev, [propertyId]: false }));
    } catch (err) {
      console.error(`Error refreshing room data for property ${propertyId}:`, err);
      setRoomDataLoading(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const filteredProperties = properties.filter(property => 
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <h1 className="text-3xl font-bold text-white mb-8">Property Management</h1>

      {/* Header with actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search properties..."
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <ComprehensiveReportButton 
            properties={properties}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> Add Property
          </button>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map(property => (
          <div key={property.id} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <div className="h-48 overflow-hidden">
              <img 
                src={property.image} 
                alt={property.name} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-white mb-2">{property.name}</h3>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="text-gray-300 hover:text-white focus:outline-none"
                    onClick={() => toggleDropdown(property.id)}
                  >
                    <FaEllipsisV />
                  </button>
                  {activeDropdown === property.id && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                          onClick={() => handleEdit(property)}
                        >
                          <FaEdit className="mr-2" /> Edit
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center"
                          onClick={() => handleDelete(property.id)}
                        >
                          <FaTrash className="mr-2" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-400 mb-4">{property.address}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <p className="text-gray-300 mr-2">
                    Rooms: <span className="font-semibold">{property.totalRooms}</span>
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshRoomData(property.id);
                    }}
                    className="text-gray-400 hover:text-gray-300"
                    disabled={roomDataLoading[property.id]}
                  >
                    <FaSync className={roomDataLoading[property.id] ? "animate-spin" : ""} size={14} />
                  </button>
                </div>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
                  onClick={() => navigate(`/admin/properties/${property.id}/rooms`)}
                >
                  View Rooms
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && !loading && (
        <div className="text-center py-10 bg-gray-900 rounded-lg">
          <p className="text-gray-400 text-lg">No properties found. Add your first property!</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <FaPlus className="inline mr-2" /> Add Property
          </button>
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onAddProperty={handleAddProperty}
      />

      {/* Edit Property Modal */}
      {editingProperty && (
        <EditPropertyModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProperty(null);
          }}
          property={editingProperty}
          onUpdateProperty={handleUpdateProperty}
        />
      )}
    </div>
  );
};

export default PropertyList;