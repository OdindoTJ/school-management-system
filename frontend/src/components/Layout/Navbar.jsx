import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, setCurrentUser, setAuthToken } from '../../api/auth';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-gray-800">SchoolMS</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium transition">Home</Link>
            <Link to="/about" className="text-gray-600 hover:text-primary-600 font-medium transition">About</Link>
            <Link to="/academics" className="text-gray-600 hover:text-primary-600 font-medium transition">Academics</Link>
            <Link to="/staff" className="text-gray-600 hover:text-primary-600 font-medium transition">Staff</Link>
            <Link to="/gallery" className="text-gray-600 hover:text-primary-600 font-medium transition">Gallery</Link>
            <Link to="/school-life" className="text-gray-600 hover:text-primary-600 font-medium transition">School Life</Link>
            <Link to="/news" className="text-gray-600 hover:text-primary-600 font-medium transition">News</Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary-600 font-medium transition">Contact</Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user.full_name || user.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-600 hover:text-primary-600 font-medium">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link to="/" className="block text-gray-600 hover:text-primary-600 font-medium">Home</Link>
            <Link to="/about" className="block text-gray-600 hover:text-primary-600 font-medium">About</Link>
            <Link to="/academics" className="block text-gray-600 hover:text-primary-600 font-medium">Academics</Link>
            <Link to="/staff" className="block text-gray-600 hover:text-primary-600 font-medium">Staff</Link>
            <Link to="/gallery" className="block text-gray-600 hover:text-primary-600 font-medium">Gallery</Link>
            <Link to="/school-life" className="block text-gray-600 hover:text-primary-600 font-medium">School Life</Link>
            <Link to="/news" className="block text-gray-600 hover:text-primary-600 font-medium">News</Link>
            <Link to="/contact" className="block text-gray-600 hover:text-primary-600 font-medium">Contact</Link>
            
            {user ? (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Welcome, {user.full_name || user.username}</p>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Link to="/login" className="block text-gray-600 hover:text-primary-600 font-medium">Login</Link>
                <Link to="/register" className="block btn-primary text-center">Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;