import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolsAPI } from '../../api/schools';

const Footer = () => {
  const [schoolInfo, setSchoolInfo] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await schoolsAPI.getSchoolInfo();
        setSchoolInfo(response.data);
      } catch (err) {
        console.error('Error fetching school info:', err);
      }
    };
    fetchInfo();
  }, []);

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">{schoolInfo?.school_name || 'Arina School'}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {schoolInfo?.slogan || 'Excellence in education. Building the leaders of tomorrow.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
              <li><Link to="/academics" className="text-gray-400 hover:text-white transition">Academics</Link></li>
              <li><Link to="/news" className="text-gray-400 hover:text-white transition">News & Events</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition">Contact</Link></li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="text-lg font-bold mb-4">Portals</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/parents-portal" className="text-gray-400 hover:text-white transition">Parents Portal</Link></li>
              <li><Link to="/students-portal" className="text-gray-400 hover:text-white transition">Student Portal</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {schoolInfo?.address && <li>📍 {schoolInfo.address}</li>}
              {schoolInfo?.phone && <li>📞 {schoolInfo.phone}</li>}
              {schoolInfo?.email && <li>✉️ {schoolInfo.email}</li>}
            </ul>
            {(schoolInfo?.facebook_url || schoolInfo?.twitter_url || schoolInfo?.instagram_url || schoolInfo?.youtube_url) && (
              <div className="flex space-x-4 mt-4">
                {schoolInfo.facebook_url && <a href={schoolInfo.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Facebook</a>}
                {schoolInfo.twitter_url && <a href={schoolInfo.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Twitter</a>}
                {schoolInfo.instagram_url && <a href={schoolInfo.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">Instagram</a>}
                {schoolInfo.youtube_url && <a href={schoolInfo.youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">YouTube</a>}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} {schoolInfo?.school_name || 'Arina School'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;