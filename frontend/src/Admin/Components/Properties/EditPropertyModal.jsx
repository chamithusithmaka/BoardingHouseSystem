import { useState, useEffect } from 'react';
import { FaTimes, FaUpload, FaBuilding } from 'react-icons/fa';
import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const EditPropertyModal = ({ isOpen, onClose, property, onUpdateProperty }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Philippines'
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    amenities: [],
    images: []
  });
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  // Available amenities options
  const amenityOptions = ['WiFi', 'Parking', 'Security', 'Laundry', 'Kitchen', 'Common Area', 'Other'];
  
  // Initialize form data when property changes
  useEffect(() => {
    if (property) {
      // Extract address from property.fullAddress or property.rawData.address
      const address = property.rawData?.address || property.fullAddress || {};
      
      setFormData({
        name: property.name || '',
        description: property.description || '',
        address: {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || '',
          country: address.country || 'Philippines'
        },
        contactInfo: {
          phone: property.rawData?.contactInfo?.phone || property.contactInfo?.phone || '',
          email: property.rawData?.contactInfo?.email || property.contactInfo?.email || ''
        },
        amenities: property.amenities || [],
        images: property.images || []
      });
    }
  }, [property]);
  
  if (!isOpen) return null;
  
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({ ...formData, name: sanitized });
      return;
    }
    if (name === 'address.city') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, city: sanitized }
      });
      return;
    }
    if (name === 'address.state') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, state: sanitized }
      });
      return;
    }
    if (name === 'address.country') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, country: sanitized }
      });
      return;
    }
    if (name === 'address.zipCode') {
      const sanitized = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, zipCode: sanitized }
      });
      return;
    }
    if (name === 'contactInfo.phone') {
      const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({
        ...formData,
        contactInfo: { ...formData.contactInfo, phone: sanitized }
      });
      return;
    }
    if (name === 'contactInfo.email') {
      const sanitized = value.replace(/[^a-zA-Z0-9@.]/g, '');
      setFormData({
        ...formData,
        contactInfo: { ...formData.contactInfo, email: sanitized }
      });
      return;
    }

    // Default handler
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const toggleAmenity = (amenity) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter(a => a !== amenity)
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      });
    }
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    
    // Convert images to base64
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    });
    
    Promise.all(promises)
      .then(base64Images => {
        setFormData({
          ...formData,
          images: [...formData.images, ...base64Images]
        });
        setUploading(false);
      })
      .catch(error => {
        console.error('Error converting images to base64:', error);
        setUploading(false);
      });
  };
  
  const removeImage = (index) => {
    const updatedImages = [...formData.images];
    updatedImages.splice(index, 1);
    setFormData({
      ...formData,
      images: updatedImages
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await axios.patch(`${API_URL}/properties/${property.id}`, formData);
      
      // Call the parent component's update function with the updated property
      onUpdateProperty(response.data.data.property);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update property');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">Edit Property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900 text-white p-3 m-4 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-1">Property Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Address Section */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Address</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-gray-400 mb-1">Street Address*</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">City*</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">State/Province*</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">ZIP Code*</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Country*</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    required
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Contact Info Section */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Amenities Section */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Amenities</h3>
              
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    className={`py-2 px-3 rounded-lg border ${
                      formData.amenities.includes(amenity)
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Images Section */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Property Images</h3>
              
              <div className="mb-4">
                <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg flex items-center inline-flex">
                  <FaUpload className="mr-2" />
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
              
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="h-24 w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.images.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center border border-dashed border-gray-700">
                  <FaBuilding className="text-gray-600 text-4xl mb-2" />
                  <p className="text-gray-400">No images added yet</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Update Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;