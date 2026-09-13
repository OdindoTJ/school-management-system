import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Portal URLs (from .env with fallbacks)
  const STUDENT_PORTAL_URL =
    import.meta.env.VITE_STUDENT_PORTAL_URL || 'http://localhost:5174/login';
  const PARENTS_PORTAL_URL =
    import.meta.env.VITE_PARENTS_PORTAL_URL || 'http://localhost:5175/login';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;
  const isPathIn = (paths) => paths.some((path) => location.pathname.startsWith(path));

  const navLinkClass = (path) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive(path)
        ? 'text-primary-600 bg-primary-50'
        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
    }`;

  const dropdownButtonClass = (paths) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
      isPathIn(paths)
        ? 'text-primary-600 bg-primary-50'
        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
    }`;

  const dropdownItemClass = (path) =>
    `block px-4 py-2 text-sm transition-colors ${
      isActive(path)
        ? 'text-primary-600 bg-primary-50 font-medium'
        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
    }`;

  return (
    <nav
      className={`bg-white sticky top-0 z-50 transition-shadow ${
        scrolled ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="container-custom">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold text-gray-800 hidden sm:block">Arina School</span>
          </Link>

          {/* Desktop Menu */}
          <div ref={dropdownRef} className="hidden lg:flex items-center space-x-1">
            <Link to="/" className={navLinkClass('/')}>
              Home
            </Link>

            {/* About Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'about' ? null : 'about')}
                className={dropdownButtonClass(['/about', '/staff'])}
              >
                About
                <svg
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === 'about' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === 'about' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                  <Link to="/about" className={dropdownItemClass('/about')}>
                    Overview
                  </Link>
                  <Link
                    to="/about#mission"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                  >
                    Mission &amp; Vision
                  </Link>
                  <Link to="/staff" className={dropdownItemClass('/staff')}>
                    Our Staff
                  </Link>
                </div>
              )}
            </div>

            <Link to="/academics" className={navLinkClass('/academics')}>
              Academics
            </Link>

            {/* Life Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'life' ? null : 'life')}
                className={dropdownButtonClass(['/school-life', '/gallery'])}
              >
                Life
                <svg
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === 'life' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === 'life' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                  <Link to="/school-life" className={dropdownItemClass('/school-life')}>
                    School Life
                  </Link>
                  <Link to="/gallery" className={dropdownItemClass('/gallery')}>
                    Gallery
                  </Link>
                </div>
              )}
            </div>

            <Link to="/news" className={navLinkClass('/news')}>
              News &amp; Events
            </Link>

            {/* Portals Dropdown — links OUT to external portals */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'portals' ? null : 'portals')}
                className={dropdownButtonClass([])}
              >
                Portals
                <svg
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === 'portals' ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === 'portals' && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                  <a
                    href={PARENTS_PORTAL_URL}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Parents Portal
                    </div>
                  </a>
                  <a
                    href={STUDENT_PORTAL_URL}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                      </svg>
                      Student Portal
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Contact Button (Desktop) */}
          <Link
            to="/contact"
            className="hidden lg:inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2.5 px-5 rounded-full transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Us
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 space-y-1">
            <Link
              to="/"
              className={`block px-4 py-2.5 rounded-lg font-medium ${
                isActive('/') ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`block px-4 py-2.5 rounded-lg font-medium ${
                isActive('/about')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              About
            </Link>
            <Link
              to="/academics"
              className={`block px-4 py-2.5 rounded-lg font-medium ${
                isActive('/academics')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Academics
            </Link>
            <Link
              to="/staff"
              className={`block px-4 py-2.5 rounded-lg font-medium ${
                isActive('/staff')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Staff
            </Link>
            <Link
              to="/school-life"
              className={`block px-4 py-2.5 rounded-lg font-medium ${
                isActive('/school-life')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              School Life
            </Link>
            <Link
              to="/gallery"
              className={`block px-4 py-2.5 rounded-lg font-medium ${
                isActive('/gallery')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Gallery
            </Link>
            <Link
              to="/news"
              className={`block px-4 py-2.5 rounded-lg font-medium ${
                isActive('/news')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              News &amp; Events
            </Link>

            <div className="pt-2 border-t border-gray-100 mt-2">
              <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Portals
              </p>
              <a
                href={PARENTS_PORTAL_URL}
                className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Parents Portal
              </a>
              <a
                href={STUDENT_PORTAL_URL}
                className="block px-4 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Student Portal
              </a>
            </div>

            <div className="pt-2">
              <Link
                to="/contact"
                className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-5 rounded-full transition-all"
              >
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;