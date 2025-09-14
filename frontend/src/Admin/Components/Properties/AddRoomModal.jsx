import { useState } from 'react';
import { FaTimes, FaPlus, FaImage, FaTrashAlt } from 'react-icons/fa';

const AddRoomModal = ({ isOpen, onClose, propertyId, propertyName, onAddRoom }) => {
  const [formData, setFormData] = useState({
    roomNumber: '',
    description: '',
    images: [],
    capacity: 1,
    status: 'vacant',
    facilities: [],
    price: {
      
      currency: 'PHP',
      period: 'monthly'
    },
    size: {
      area: '',
      unit: 'sqm'
    }
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const facilityOptions = ['Air Conditioning', 'Private Bathroom', 'Desk', 'Closet', 'Window', 'TV', 'Internet'];
  const periodOptions = ['monthly', 'weekly', 'daily'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only allow numbers and dot for price.amount and size.area
    if (name === 'price.amount' || name === 'size.area') {
      // Remove any character that is not a digit or dot
      const sanitized = value.replace(/[^0-9.]/g, '');
      // Prevent multiple dots
      const valid = sanitized.replace(/(\..*)\./g, '$1');
      setFormData({
        ...formData,
        [name.split('.')[0]]: {
          ...formData[name.split('.')[0]],
          [name.split('.')[1]]: valid
        }
      });
      return;
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: parent === 'price' && child === 'amount' ? parseFloat(value) || '' : value
        }
      });
    } else if (name === 'capacity') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 1
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

  const handleFacilityToggle = (facility) => {
    if (formData.facilities.includes(facility)) {
      setFormData({
        ...formData,
        facilities: formData.facilities.filter(f => f !== facility)
      });
    } else {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facility]
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.roomNumber.trim()) newErrors.roomNumber = 'Room number is required';
    if (formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';

    // Price validation
    const price = parseFloat(formData.price.amount);
    if (isNaN(price) || price <= 0) newErrors.price = 'Price must be a positive number';

    // Room size validation
    const area = parseFloat(formData.size.area);
    if (isNaN(area) || area <= 0) newErrors.size = 'Room size must be a positive number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Generate room ID
      const propertyPrefix = propertyName.substring(0, 3).toUpperCase();
      const paddedNumber = formData.roomNumber.padStart(3, '0');
      const roomId = `${propertyPrefix}-${paddedNumber}`;
      
      onAddRoom({
        ...formData,
        roomId,
        property: propertyId,
        occupants: []
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">Add New Room to {propertyName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Room Number</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                className={`w-full p-3 bg-gray-700 border ${errors.roomNumber ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="e.g. 101, A1, etc."
              />
              {errors.roomNumber && <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>}
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Capacity</label>
              <input
                type="number"
                name="capacity"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                className={`w-full p-3 bg-gray-700 border ${errors.capacity ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Price Amount</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">LKR: </span>
                <input
                  type="number"
                  name="price.amount"
                  value={formData.price.amount}
                  onChange={handleChange}
                  onKeyDown={e => e.key === '-' && e.preventDefault()}
                  className={`w-full p-3 pl-8 bg-gray-700 border ${errors.price ? 'border-red-500' : 'border-gray-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  min="1"
                  step="any"
                />
              </div>
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Price Period</label>
              <select
                name="price.period"
                value={formData.price.period}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periodOptions.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Room Size</label>
              <div className="flex">
                <input
                  type="number"
                  name="size.area"
                  value={formData.size.area}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Area"
                  onKeyDown={e => e.key === '-' && e.preventDefault()}
                  min="1"
                  step="any"
                />
                <select
                  name="size.unit"
                  value={formData.size.unit}
                  onChange={handleChange}
                  className="p-3 bg-gray-700 border border-gray-600 rounded-r-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sqm">sqm</option>
                  <option value="sqft">sqft</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Initial Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vacant">Vacant</option>
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Room Images</label>
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
                      alt={`Room ${index + 1}`}
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
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              placeholder="Enter room description"
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Facilities</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {facilityOptions.map((facility) => (
                <div 
                  key={facility}
                  className={`
                    p-3 rounded-lg cursor-pointer border text-center
                    ${formData.facilities.includes(facility) 
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
              Add Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomModal;