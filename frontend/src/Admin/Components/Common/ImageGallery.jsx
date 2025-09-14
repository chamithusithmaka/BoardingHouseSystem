import React, { useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa';

const ImageGallery = ({ images, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none"
      >
        <FaTimes size={24} />
      </button>

      <button
        onClick={handlePrevious}
        className="absolute left-4 text-white hover:text-gray-300 focus:outline-none"
      >
        <FaArrowLeft size={24} />
      </button>

      <div className="max-w-4xl max-h-screen p-4">
        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] mx-auto"
        />
      </div>

      <button
        onClick={handleNext}
        className="absolute right-4 text-white hover:text-gray-300 focus:outline-none"
      >
        <FaArrowRight size={24} />
      </button>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="bg-black bg-opacity-50 rounded-full px-4 py-1 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;