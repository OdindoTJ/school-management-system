import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const Home = () => {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching school info...');
        const response = await apiClient.get('/schools/school-info/active/');
        console.log('School data:', response.data);
        setSchoolInfo(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching school info:', err);
        setError('Failed to load school information. Please try again later.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <p className="text-gray-500 mt-2">Check console for details</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-700 to-primary-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        </div>

        <div className="container-custom relative z-10 py-20">
          <div className="max-w-3xl">
            {schoolInfo && (
              <>
                <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 text-white border border-white/20">
                  <span className="text-sm font-medium">🏆 {schoolInfo.slogan || 'Excellence in Education'}</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                  Welcome to
                  <span className="block text-yellow-400">{schoolInfo.school_name}</span>
                </h1>
                
                <p className="text-xl text-white/90 leading-relaxed mb-10 max-w-2xl">
                  Nurturing tomorrow's leaders through quality education, character development, 
                  and a supportive community that inspires excellence.
                </p>
              </>
            )}
            
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/register" 
                className="bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                Enroll Now
              </Link>
              <Link 
                to="/about" 
                className="bg-transparent border-2 border-white/40 hover:border-white text-white hover:bg-white/10 font-semibold py-4 px-10 rounded-full transition-all"
              >
                Explore More
              </Link>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 w-1/3 h-1/2 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute left-1/4 top-1/4 w-1/4 h-1/4 bg-primary-400/10 rounded-full blur-2xl"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white -mt-10 relative z-20">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl mb-2">👨‍🎓</div>
              <div className="text-4xl font-bold text-primary-700">500+</div>
              <p className="text-gray-600 text-sm mt-1">Students</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl mb-2">👩‍🏫</div>
              <div className="text-4xl font-bold text-primary-700">50+</div>
              <p className="text-gray-600 text-sm mt-1">Teachers</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl mb-2">📚</div>
              <div className="text-4xl font-bold text-primary-700">20+</div>
              <p className="text-gray-600 text-sm mt-1">Subjects</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="text-4xl mb-2">🏅</div>
              <div className="text-4xl font-bold text-primary-700">95%</div>
              <p className="text-gray-600 text-sm mt-1">Pass Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Our School</h2>
            <p className="text-lg text-gray-600">
              We provide a nurturing environment where every student can thrive academically, 
              socially, and emotionally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-10 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Quality Education</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive curriculum designed to develop critical thinking, creativity, 
                and lifelong learning skills.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-10 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Expert Teachers</h3>
              <p className="text-gray-600 leading-relaxed">
                Dedicated and experienced educators committed to nurturing each student's 
                unique potential and abilities.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-10 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Modern Facilities</h3>
              <p className="text-gray-600 leading-relaxed">
                State-of-the-art classrooms, laboratories, library, and sports facilities 
                for holistic development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>
        
        <div className="container-custom relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Give your child the gift of quality education in a nurturing environment 
            that builds character and academic excellence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/register" 
              className="bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-12 rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
              Enroll Now
            </Link>
            <Link 
              to="/contact" 
              className="bg-transparent border-2 border-white/40 hover:border-white text-white hover:bg-white/10 font-semibold py-4 px-12 rounded-full transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;