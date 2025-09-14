import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserPlus, FaUserMinus, FaEdit, FaSearch, FaIdCard } from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const TenantManagement = ({ roomId, onUpdate }) => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTenant, setNewTenant] = useState({
    userId: '', // Add this field
    name: '',
    email: '',
    phone: '',
    photo: '',
    notes: ''
  });
  const [editingTenant, setEditingTenant] = useState(null);

  // Fetch room data
  useEffect(() => {
    fetchRoomData();
  }, [roomId]);
  
  const fetchRoomData = async () => {
    try {
      setLoading(true);
      
      // Fetch room details including current occupants
      const roomResponse = await axios.get(`${API_URL}/rooms/${roomId}`);
      setRoom(roomResponse.data.data.room);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError(err.response?.data?.message || 'Failed to fetch room data');
      setLoading(false);
    }
  };
  
  const handleAddTenant = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API_URL}/rooms/${roomId}/tenants`, newTenant);
      
      // Reset form and refresh data
      setNewTenant({
        userId: '', // Reset this field
        name: '',
        email: '',
        phone: '',
        photo: '',
        notes: ''
      });
      setShowAddForm(false);
      fetchRoomData();
      
      // Notify parent component to update
      if (onUpdate) onUpdate();
      
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add tenant');
    }
  };
  
  const handleRemoveTenant = async (tenantId) => {
    if (window.confirm('Are you sure you want to remove this tenant from the room?')) {
      try {
        await axios.delete(`${API_URL}/rooms/${roomId}/tenants/${tenantId}`);
        
        // Refresh data
        fetchRoomData();
        
        // Notify parent component to update
        if (onUpdate) onUpdate();
        
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove tenant');
      }
    }
  };
  
  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    
    try {
      await axios.patch(`${API_URL}/rooms/${roomId}/tenants/${editingTenant._id}`, editingTenant);
      
      // Reset form and refresh data
      setEditingTenant(null);
      fetchRoomData();
      
      // Notify parent component to update
      if (onUpdate) onUpdate();
      
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tenant');
    }
  };
  
  const handlePhotoUpload = (e, isNewTenant = true) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (isNewTenant) {
        setNewTenant({ ...newTenant, photo: reader.result });
      } else {
        setEditingTenant({ ...editingTenant, photo: reader.result });
      }
    };
  };
  
  const filteredTenants = room?.occupants?.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone?.includes(searchTerm)
  ) || [];
  
  // Add this function to determine the real room status
  const getRealStatus = (room) => {
    if (!room.occupants || room.occupants.length === 0) {
      return 'vacant';
    } else if (room.occupants.length >= room.capacity) {
      return 'full';
    } else {
      return 'available';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">{room.roomId || `Room ${room.roomNumber}`}</h3>
            <p className="text-gray-400">
              Occupancy: {room.occupants?.length || 0} / {room.capacity}
            </p>
          </div>
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${getRealStatus(room) === 'vacant' ? 'bg-gray-600 text-white' : ''}
            ${getRealStatus(room) === 'available' ? 'bg-green-600 text-white' : ''}
            ${getRealStatus(room) === 'full' ? 'bg-red-600 text-white' : ''}
            ${getRealStatus(room) === 'maintenance' ? 'bg-yellow-600 text-white' : ''}
          `}>
            {getRealStatus(room).charAt(0).toUpperCase() + getRealStatus(room).slice(1)}
          </div>
        </div>
      </div>
      
      {/* Search and add tenant button */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-grow max-w-md">
          <FaSearch className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {!showAddForm && room.occupants?.length < room.capacity && (
          <button
            onClick={() => setShowAddForm(true)}
            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
          >
            <FaUserPlus className="mr-2" /> Add Tenant
          </button>
        )}
      </div>
      
      {/* Add tenant form */}
      {showAddForm && (
        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Tenant</h3>
          
          <form onSubmit={handleAddTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1">User ID (Optional)</label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={newTenant.userId}
                    onChange={(e) => setNewTenant({...newTenant, userId: e.target.value})}
                    className="w-full p-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter user ID for tracking"
                  />
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Used to associate the tenant with a user account
                </p>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Name*</label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={newTenant.email}
                onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tenant@example.com"
              />
              <p className="text-gray-400 text-xs mt-1">
                The tenant will receive confirmation emails at this address
              </p>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {newTenant.photo && (
                <div className="mt-2">
                  <img 
                    src={newTenant.photo} 
                    alt="Tenant preview" 
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Notes</label>
              <textarea
                value={newTenant.notes}
                onChange={(e) => setNewTenant({...newTenant, notes: e.target.value})}
                rows="3"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Add Tenant
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Edit tenant form */}
      {editingTenant && (
        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Tenant</h3>
          
          <form onSubmit={handleUpdateTenant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1">User ID (Optional)</label>
                <div className="relative">
                  <FaIdCard className="absolute left-3 top-3 text-gray-500" />
                  <input
                    type="text"
                    value={editingTenant.userId || ''}
                    onChange={(e) => setEditingTenant({...editingTenant, userId: e.target.value})}
                    className="w-full p-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter user ID for tracking"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Name*</label>
                <input
                  type="text"
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={editingTenant.phone || ''}
                  onChange={(e) => setEditingTenant({...editingTenant, phone: e.target.value})}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={editingTenant.email || ''}
                onChange={(e) => setEditingTenant({...editingTenant, email: e.target.value})}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, false)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {editingTenant.photo && (
                <div className="mt-2">
                  <img 
                    src={editingTenant.photo} 
                    alt="Tenant preview" 
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Notes</label>
              <textarea
                value={editingTenant.notes || ''}
                onChange={(e) => setEditingTenant({...editingTenant, notes: e.target.value})}
                rows="3"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Update Tenant
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Tenant list */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">
          Tenants ({filteredTenants.length}/{room.capacity})
        </h3>
        
        {filteredTenants.length > 0 ? (
          <div className="space-y-3">
            {filteredTenants.map(tenant => (
              <div key={tenant._id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {tenant.photo ? (
                      <img 
                        src={tenant.photo} 
                        alt={tenant.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg">{tenant.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-white font-medium">{tenant.name}</div>
                    {tenant.phone && <div className="text-gray-400 text-sm">{tenant.phone}</div>}
                    {tenant.email && <div className="text-gray-400 text-sm">{tenant.email}</div>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTenant(tenant)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900 hover:bg-opacity-30 p-2 rounded-full"
                    title="Edit tenant"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleRemoveTenant(tenant._id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-30 p-2 rounded-full"
                    title="Remove from room"
                  >
                    <FaUserMinus />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 p-4 rounded-lg text-center text-gray-400">
            {searchTerm ? 'No matching tenants found' : 'No tenants assigned to this room'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantManagement;