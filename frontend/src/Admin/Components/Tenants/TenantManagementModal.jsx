import { FaTimes } from 'react-icons/fa';
import TenantManagement from './TenantManagement';

const TenantManagementModal = ({ isOpen, onClose, roomId, roomName, onUpdate }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">Manage Tenants for {roomName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <TenantManagement 
            roomId={roomId} 
            onUpdate={() => {
              if (onUpdate) onUpdate();
            }}
          />
        </div>
        
        <div className="border-t border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantManagementModal;