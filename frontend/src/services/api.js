import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for future auth token handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Property API calls
export const propertyAPI = {
  getAllProperties: () => api.get('/properties'),
  getProperty: (id) => api.get(`/properties/${id}`),
  createProperty: (propertyData) => api.post('/properties', propertyData),
  updateProperty: (id, propertyData) => api.patch(`/properties/${id}`, propertyData),
  deleteProperty: (id) => api.delete(`/properties/${id}`),
  getPropertyRooms: (id) => api.get(`/properties/${id}/rooms`),
  getPropertyStats: (id) => api.get(`/properties/${id}/stats`),
};

// Room API calls
export const roomAPI = {
  getAllRooms: (params) => api.get('/rooms', { params }),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (roomData) => api.post('/rooms', roomData),
  updateRoom: (id, roomData) => api.patch(`/rooms/${id}`, roomData),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
  allocateRoom: (data) => api.post('/rooms/allocate', data),
  removeTenant: (data) => api.post('/rooms/remove-tenant', data),
  createTransferRequest: (data) => api.post('/rooms/transfer-request', data),
  updateTransferRequest: (data) => api.patch('/rooms/transfer-request', data),
  getUnassignedTenants: () => api.get('/rooms/allocation/unassigned'),
  smartAllocation: () => api.get('/rooms/allocation/smart'),
};

export default api;