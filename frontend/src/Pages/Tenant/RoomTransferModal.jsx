import { useState } from 'react';
import axios from 'axios';
import { 
  FaTimesCircle, FaExchangeAlt, FaArrowRight, 
  FaMapMarkerAlt, FaUsers, FaSpinner, FaSearch, FaCheckCircle
} from 'react-icons/fa';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const RoomTransferModal = ({ 
  isOpen, 
  onClose, 
  currentRoom, 
  availableRooms, 
  loadingRooms, 
  tenant,
  userId,
  onTransferSuccess 
}) => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reason, setReason] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Filter rooms based on search term
  const filteredRooms = availableRooms.filter(room => {
    const searchLower = searchTerm.toLowerCase();
    const roomIdMatch = room.roomId?.toLowerCase().includes(searchLower) || false;
    const roomNumberMatch = room.roomNumber?.toString().toLowerCase().includes(searchLower) || false;
    const propertyMatch = room.property?.name?.toLowerCase().includes(searchLower) || false;
    return roomIdMatch || roomNumberMatch || propertyMatch;
  });

  // Update the handleSubmit function to properly handle success
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom || !reason.trim() || !moveInDate) {
      setError('Please select a room, provide a reason, and choose a move-in date');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Send transfer request to the API
      const response = await axios.post(`${API_URL}/rooms/transfer-request`, {
        userId: userId || 'user123', // Use actual user ID if available
        currentRoomId: currentRoom._id,
        newRoomId: selectedRoom._id,
        name: tenant?.name || 'Chamithu Sithmaka', // Use demo name as fallback
        email: tenant?.email || 'chamith@example.com',
        phone: tenant?.phone,
        photo: tenant?.photo,
        reason,
        notes,
        moveInDate,
        isTransferRequest: true,  // Important: Mark as transfer request
        requestType: 'transfer',  // Also set the request type
      });
      
      setSubmitting(false);
      
      if (response.data.status === 'success') {
        setSuccess(true);
        // Call onTransferSuccess with true to trigger refresh in parent
        setTimeout(() => {
          if (onTransferSuccess) {
            onTransferSuccess(true);
          } else {
            onClose();
          }
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting transfer request:', err);
      setSubmitting(false);
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <FaExchangeAlt className="mr-3 text-amber-500" />
              Request Room Transfer
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <FaTimesCircle size={24} />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <FaCheckCircle className="text-white text-3xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transfer Request Submitted!</h3>
              <p className="text-gray-300 mb-6">
                Your room transfer request has been submitted successfully. 
                You'll be notified once the admin reviews your request.
              </p>
              <button
                onClick={onTransferSuccess || onClose}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-100">
                  <div className="flex items-start">
                    <FaTimesCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              {/* Current Room Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Current Room</h3>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{currentRoom?.roomId || `Room ${currentRoom?.roomNumber}`}</p>
                      <div className="text-sm text-gray-400 flex items-center mt-1">
                        <FaMapMarkerAlt className="mr-1" />
                        <span>
                          {currentRoom?.property?.name || 'Property'}, 
                          {currentRoom?.property?.address?.city && ` ${currentRoom.property.address.city}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaUsers className="text-gray-400 mr-2" />
                      <span>{currentRoom?.occupants?.length || 0} / {currentRoom?.capacity || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Available Rooms */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Select Room to Transfer To</h3>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-500" />
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search rooms"
                      className="bg-gray-700 border border-gray-600 pl-10 pr-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-lg overflow-hidden">
                  {loadingRooms ? (
                    <div className="flex justify-center items-center p-8">
                      <FaSpinner className="text-amber-500 animate-spin text-2xl mr-3" />
                      <span>Loading available rooms...</span>
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-400">No available rooms found</p>
                      <p className="text-sm mt-2 text-gray-500">
                        {searchTerm ? 'Try different search terms or clear the search' : 'There are currently no available rooms'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {filteredRooms.map(room => (
                        <div 
                          key={room._id}
                          className={`border-b border-gray-600 last:border-0 p-4 cursor-pointer hover:bg-gray-600 transition-colors flex justify-between items-center ${
                            selectedRoom?._id === room._id ? 'bg-gray-600' : ''
                          }`}
                          onClick={() => setSelectedRoom(room)}
                        >
                          <div>
                            <p className="font-semibold">{room.roomId || `Room ${room.roomNumber}`}</p>
                            <div className="text-sm text-gray-400 flex items-center mt-1">
                              <FaMapMarkerAlt className="mr-1" />
                              <span>
                                {room.property?.name || 'Property'}, 
                                {room.property?.address?.city && ` ${room.property.address.city}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="mr-4 text-amber-400">
                              LKR:{room.price?.amount?.toLocaleString() || 'N/A'} 
                              <span className="text-xs text-gray-400">/{room.price?.period || 'month'}</span>
                            </div>
                            <div className="flex items-center text-gray-300">
                              <FaUsers className="mr-2" />
                              <span>{room.occupants?.length || 0} / {room.capacity || 0}</span>
                            </div>
                            
                            {selectedRoom?._id === room._id && (
                              <div className="ml-3 w-4 h-4 bg-amber-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Transfer Details */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold">Transfer Details</h3>
                
                <div>
                  <label className="block text-gray-300 mb-1">Reason for Transfer *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows="3"
                    placeholder="Please explain why you're requesting a room transfer..."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Preferred Move-in Date *</label>
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    required
                    min={new Date(new Date().getTime() + 86400000).toISOString().split('T')[0]} // Tomorrow
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-1">Additional Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows="2"
                    placeholder="Any additional information you'd like to provide..."
                  ></textarea>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRoom || !reason.trim() || !moveInDate}
                  className={`px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors flex items-center ${
                    submitting || !selectedRoom || !reason.trim() || !moveInDate ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaExchangeAlt className="mr-2" />
                      Submit Transfer Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomTransferModal;