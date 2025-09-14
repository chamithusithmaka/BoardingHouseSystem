import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="h-10 w-10 rounded-full bg-red-900 flex items-center justify-center">
                <FaExclamationTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                {title || 'Confirm Action'}
              </h3>
              <p className="text-sm text-gray-300">
                {message || 'Are you sure you want to perform this action?'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;