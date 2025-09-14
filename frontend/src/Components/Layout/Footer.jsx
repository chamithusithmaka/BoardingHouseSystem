import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            {/* <div className="flex items-center mb-4">
              <img 
                src="/logo.png" 
                alt="BoardingHouse" 
                className="h-8 w-auto mr-2"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/40x40?text=BH";
                }}
              />
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                BoardingHouse
              </span>
            </div> */}
            <p className="text-sm leading-relaxed mb-4">
              Find your perfect boarding house accommodation with us. We offer a wide range of affordable and comfortable 
              living spaces for students and young professionals.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="text-gray-400 hover:text-amber-400" aria-label="Facebook">
                <FaFacebook size={20} />
              </a>
              <a href="https://twitter.com" className="text-gray-400 hover:text-amber-400" aria-label="Twitter">
                <FaTwitter size={20} />
              </a>
              <a href="https://instagram.com" className="text-gray-400 hover:text-amber-400" aria-label="Instagram">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-amber-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/properties" className="text-gray-400 hover:text-amber-400 transition-colors">Properties</Link>
              </li>
              <li>
                <Link to="/rooms" className="text-gray-400 hover:text-amber-400 transition-colors">Available Rooms</Link>
              </li>
              <li>
                <Link to="/faqs" className="text-gray-400 hover:text-amber-400 transition-colors">FAQs</Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-amber-400 transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-amber-400 transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaMapMarkerAlt className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
                <span>123 Boarding St., Manila, Philippines</span>
              </li>
              <li className="flex items-center">
                <FaPhone className="text-amber-500 mr-3 flex-shrink-0" />
                <span>+63 912 345 6789</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="text-amber-500 mr-3 flex-shrink-0" />
                <span>info@boardinghouse.com</span>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Newsletter</h3>
            <p className="text-sm mb-4">Subscribe to receive updates on new properties and promotions.</p>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        {/* Bottom Copyright */}
        <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-center text-gray-500">
          <p>© {new Date().getFullYear()} BoardingHouse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;