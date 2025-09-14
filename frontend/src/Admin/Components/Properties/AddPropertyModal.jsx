import { useState } from 'react';
import { FaTimes, FaImage, FaTrashAlt } from 'react-icons/fa';

const AddPropertyModal = ({ isOpen, onClose, onAddProperty }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka'
    },
    description: '',
    images: [],
    amenities: [],
    contactInfo: {
      phone: '',
      email: ''
    },
    owner: '65731c22f704dc8f4abda89a' // Temporary owner ID until you implement auth
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const amenityOptions = ['WiFi', 'Parking', 'Security', 'Laundry', 'Kitchen', 'Common Area'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Property Name: only letters and spaces
    if (name === 'name') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({ ...formData, name: sanitized });
      return;
    }

    // City: only letters and spaces
    if (name === 'address.city') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, city: sanitized }
      });
      return;
    }

    // State/Province: only letters and spaces
    if (name === 'address.state') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, state: sanitized }
      });
      return;
    }

    // Country: only letters and spaces
    if (name === 'address.country') {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, country: sanitized }
      });
      return;
    }

    // Zip Code: only numbers
    if (name === 'address.zipCode') {
      const sanitized = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        address: { ...formData.address, zipCode: sanitized }
      });
      return;
    }

    // Phone: only 10 digits
    if (name === 'contactInfo.phone') {
      const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({
        ...formData,
        contactInfo: { ...formData.contactInfo, phone: sanitized }
      });
      return;
    }

    // Email: allow only letters, numbers, @, .
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

  const handleAmenityToggle = (amenity) => {
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

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Property name is required';
    if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.address.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.state.trim()) newErrors.state = 'State is required';
    if (!formData.address.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onAddProperty(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">Add New Property</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Property Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-3 bg-gray-700 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter property name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Street Address</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              className={`w-full p-3 bg-gray-700 border ${errors.street ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter street address"
            />
            {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">City</label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className={`w-full p-3 bg-gray-700 border ${errors.city ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter city"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-gray-300 mb-2">State/Province</label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className={`w-full p-3 bg-gray-700 border ${errors.state ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter state/province"
              />
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Zip Code</label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                className={`w-full p-3 bg-gray-700 border ${errors.zipCode ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter zip code"
              />
              {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Country</label>
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter country"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Phone</label>
              <input
                type="text"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact phone"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="contactInfo.email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter contact email"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              placeholder="Enter property description"
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Property Images</label>
            <div className="mb-2">
              <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg flex items-center justify-center">
                <FaImage className="mr-2" />
                {uploading ? "Uploading..." : "Choose Images"}
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
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
                      <FaTrashAlt size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Amenities</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {amenityOptions.map((amenity) => (
                <div 
                  key={amenity}
                  className={`
                    p-3 rounded-lg cursor-pointer border
                    ${formData.amenities.includes(amenity) 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}
                  `}
                  onClick={() => handleAmenityToggle(amenity)}
                >
                  {amenity}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:outline-none"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;