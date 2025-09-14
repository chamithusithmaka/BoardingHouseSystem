import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaHome, FaMapMarkerAlt, FaStar, FaUsers, FaCheckCircle, FaRegClock, FaShieldAlt } from 'react-icons/fa';
import Header from '../../Components/Layout/Header';
import Footer from '../../Components/Layout/Footer';

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;
  
  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "John Smith",
      role: "Student",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "Finding accommodation was so easy with BoardingHouse. I found a perfect room close to my university within my budget."
    },
    {
      id: 2,
      name: "Maria Garcia",
      role: "Young Professional",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
      text: "The platform made it simple to compare different boarding houses. I love my new place and the amenities it offers."
    },
    {
      id: 3,
      name: "David Chen",
      role: "Exchange Student",
      image: "https://randomuser.me/api/portraits/men/67.jpg",
      text: "As an international student, I was worried about finding accommodation. BoardingHouse made the process stress-free."
    }
  ];
  
  // Automatic slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
      <Header />
      <main className="bg-gray-900 text-white">
        {/* Hero Section */}
        <section className="relative h-[70vh] min-h-[500px] bg-gray-800 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <img 
              src={`/images/hero-${currentSlide + 1}.jpg`} 
              alt="Boarding house" 
              className="w-full h-full object-cover transition-opacity duration-1000"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80";
              }}
            />
          </div>
          
          <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-amber-400">Unlock Your Future</span> Find Your Perfect Property
              </h1>
              <p className="text-lg mb-8 text-gray-200">
                Discover comfortable and affordable boarding houses for students and professionals.
                Your ideal home away from home is just a few clicks away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/rooms" 
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <FaHome className="mr-2" /> Find Rooms
                </Link>
                <Link 
                  to="/properties" 
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <FaSearch className="mr-2" /> Browse Properties
                </Link>
              </div>
            </div>
          </div>
          
          {/* Slider navigation */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {[...Array(totalSlides)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-amber-500' : 'bg-gray-400'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Search Section */}
        <section className="py-10 bg-gray-850 border-y border-gray-800">
          <div className="container mx-auto px-4">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-center">Find Your Ideal Boarding House</h2>
              
              <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Location</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="City or area" 
                      className="w-full pl-10 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Price Range</label>
                  <select className="w-full py-3 px-4 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">All price ranges</option>
                    <option value="0-5000">₱0 - ₱5,000</option>
                    <option value="5000-10000">₱5,000 - ₱10,000</option>
                    <option value="10000-15000">₱10,000 - ₱15,000</option>
                    <option value="15000+">₱15,000+</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  <FaSearch className="mr-2" /> Search
                </button>
              </form>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose <span className="text-amber-400">BoardingHouse</span></h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                We're dedicated to helping you find the perfect accommodation that fits your needs and budget.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-amber-500 transition-colors">
                <div className="text-amber-500 mb-4">
                  <FaStar size={40} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Accommodation</h3>
                <p className="text-gray-400">
                  All our listed properties are verified to ensure they meet our quality standards.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-amber-500 transition-colors">
                <div className="text-amber-500 mb-4">
                  <FaUsers size={40} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community Living</h3>
                <p className="text-gray-400">
                  Join a community of like-minded individuals and make lasting connections.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-amber-500 transition-colors">
                <div className="text-amber-500 mb-4">
                  <FaRegClock size={40} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quick Booking</h3>
                <p className="text-gray-400">
                  Our streamlined process lets you secure your accommodation in minutes.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-amber-500 transition-colors">
                <div className="text-amber-500 mb-4">
                  <FaShieldAlt size={40} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                <p className="text-gray-400">
                  All transactions are protected with industry-standard security measures.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Properties Section */}
        <section className="py-16 bg-gray-850 border-y border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Featured Properties</h2>
              <Link to="/properties" className="text-amber-400 hover:underline">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property Card 1 */}
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-1 transition-transform">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="/images/property-1.jpg" 
                    alt="Student Boarding House" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Student Boarding House</h3>
                  <div className="flex items-center text-gray-400 mb-3">
                    <FaMapMarkerAlt className="mr-1" />
                    <span className="text-sm">Manila, Philippines</span>
                  </div>
                  <p className="text-amber-400 font-semibold mb-4">From ₱5,000 / month</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">4 available rooms</span>
                    <Link 
                      to="/properties/1" 
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Property Card 2 */}
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-1 transition-transform">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="/images/property-2.jpg" 
                    alt="Urban Dormitory" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Urban Dormitory</h3>
                  <div className="flex items-center text-gray-400 mb-3">
                    <FaMapMarkerAlt className="mr-1" />
                    <span className="text-sm">Quezon City, Philippines</span>
                  </div>
                  <p className="text-amber-400 font-semibold mb-4">From ₱7,500 / month</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">2 available rooms</span>
                    <Link 
                      to="/properties/2" 
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Property Card 3 */}
              <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:-translate-y-1 transition-transform">
                <div className="h-48 overflow-hidden">
                  <img 
                    src="/images/property-3.jpg" 
                    alt="Professionals Residence" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Professionals Residence</h3>
                  <div className="flex items-center text-gray-400 mb-3">
                    <FaMapMarkerAlt className="mr-1" />
                    <span className="text-sm">Makati, Philippines</span>
                  </div>
                  <p className="text-amber-400 font-semibold mb-4">From ₱10,000 / month</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">6 available rooms</span>
                    <Link 
                      to="/properties/3" 
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Hear from students and professionals who found their ideal accommodation through our platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map(testimonial => (
                <div 
                  key={testimonial.id}
                  className="bg-gray-800 p-6 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center mb-4">
                    <img 
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">"{testimonial.text}"</p>
                  <div className="mt-4 flex text-amber-400">
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-amber-700 to-amber-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Room?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students and professionals who have found their ideal accommodation with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/rooms" 
                className="px-8 py-3 bg-white text-amber-900 hover:bg-gray-100 rounded-md font-semibold transition-colors"
              >
                Browse Rooms
              </Link>
              <Link 
                to="/register" 
                className="px-8 py-3 bg-transparent hover:bg-amber-800 border-2 border-white rounded-md font-semibold transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default HomePage;