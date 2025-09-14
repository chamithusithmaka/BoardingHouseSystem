import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaCog, FaClock, FaArrowLeft, FaSpinner, 
  FaSave, FaBell, FaEnvelope, FaDollarSign
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const UtilitySettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [settings, setSettings] = useState({
    allowedDailyHours: 10,
    extraHourlyRate: 20,
    notifyExceededHours: true,
    notifyFinance: true,
    financeEmail: '',
    remarks: ''
  });

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/properties`);
        setProperties(response.data.data.properties);
        
        // Select the first property by default
        if (response.data.data.properties.length > 0) {
          setSelectedProperty(response.data.data.properties[0]._id);
          fetchSettings(response.data.data.properties[0]._id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again later.');
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Fetch settings for a property
  const fetchSettings = async (propertyId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/utility-settings/${propertyId}`);
      setSettings(response.data.data.settings);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching utility settings:', err);
      
      // If settings don't exist, show defaults
      setSettings({
        allowedDailyHours: 10,
        extraHourlyRate: 20,
        notifyExceededHours: true,
        notifyFinance: true,
        financeEmail: '',
        remarks: ''
      });
      
      setLoading(false);
    }
  };

  // Handle property change
  const handlePropertyChange = (e) => {
    const propertyId = e.target.value;
    setSelectedProperty(propertyId);
    fetchSettings(propertyId);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProperty) {
      alert('Please select a property');
      return;
    }
    
    try {
      setSaving(true);
      await axios.put(`${API_URL}/utility-settings/${selectedProperty}`, settings);
      alert('Utility settings updated successfully');
      setSaving(false);
    } catch (err) {
      console.error('Error updating utility settings:', err);
      alert('Failed to update utility settings. Please try again.');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FaCog className="mr-3 text-amber-500" />
            Utility & Attendance Settings
          </h1>
          
          <button 
            onClick={() => navigate('/admin/attendance')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <FaArrowLeft className="mr-2" /> 
            Back to Dashboard
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <FaSpinner className="text-amber-500 text-3xl animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-8 text-center">
              {error}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Property Selection */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2 font-medium">Select Property</label>
                <select
                  value={selectedProperty}
                  onChange={handlePropertyChange}
                  className="bg-gray-700 border border-gray-600 rounded w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Select Property --</option>
                  {properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-400 mt-1">
                  Configure utility settings for each property separately
                </p>
              </div>
              
              {selectedProperty && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Daily Hours Allowed */}
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">
                        <div className="flex items-center">
                          <FaClock className="text-amber-500 mr-2" />
                          Daily Hours Allowed
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="allowedDailyHours"
                          value={settings.allowedDailyHours}
                          onChange={handleChange}
                          min="1"
                          max="24"
                          step="0.5"
                          className="bg-gray-700 border border-gray-600 rounded w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                          hours
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Maximum number of hours a tenant can use utilities per day
                      </p>
                    </div>
                    
                    {/* Extra Hourly Rate */}
                    <div>
                      <label className="block text-gray-300 mb-2 font-medium">
                        <div className="flex items-center">
                          <FaDollarSign className="text-amber-500 mr-2" />
                          Extra Hourly Rate
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="extraHourlyRate"
                          value={settings.extraHourlyRate}
                          onChange={handleChange}
                          min="0"
                          step="5"
                          className="bg-gray-700 border border-gray-600 rounded w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                          per hour
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Rate charged for each extra hour beyond the daily limit
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Notify Tenant */}
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notifyExceededHours"
                            name="notifyExceededHours"
                            type="checkbox"
                            checked={settings.notifyExceededHours}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="notifyExceededHours" className="text-gray-300 font-medium flex items-center">
                            <FaBell className="text-amber-500 mr-2" />
                            Notify Tenant
                          </label>
                          <p className="text-sm text-gray-400 mt-1">
                            Send notification to tenant when they exceed daily hours
                          </p>
                        </div>
                      </div>
                      
                      {/* Notify Finance */}
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="notifyFinance"
                            name="notifyFinance"
                            type="checkbox"
                            checked={settings.notifyFinance}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="notifyFinance" className="text-gray-300 font-medium flex items-center">
                            <FaEnvelope className="text-amber-500 mr-2" />
                            Notify Finance Department
                          </label>
                          <p className="text-sm text-gray-400 mt-1">
                            Send email to finance department for billing
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Finance Email */}
                  {settings.notifyFinance && (
                    <div className="mt-6">
                      <label className="block text-gray-300 mb-2 font-medium">
                        <div className="flex items-center">
                          <FaEnvelope className="text-amber-500 mr-2" />
                          Finance Department Email
                        </div>
                      </label>
                      <input
                        type="email"
                        name="financeEmail"
                        value={settings.financeEmail}
                        onChange={handleChange}
                        className="bg-gray-700 border border-gray-600 rounded w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        required={settings.notifyFinance}
                        placeholder="finance@example.com"
                      />
                    </div>
                  )}
                  
                  {/* Remarks */}
                  <div className="mt-6">
                    <label className="block text-gray-300 mb-2 font-medium">Remarks</label>
                    <textarea
                      name="remarks"
                      value={settings.remarks}
                      onChange={handleChange}
                      rows="3"
                      className="bg-gray-700 border border-gray-600 rounded w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Additional notes about utility settings..."
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default UtilitySettingsPage;