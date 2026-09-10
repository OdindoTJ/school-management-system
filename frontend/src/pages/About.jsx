import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

const About = () => {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const response = await apiClient.get('/schools/about/active/');
        setAbout(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching about:', err);
        setError('Failed to load about information.');
        setLoading(false);
      }
    };
    fetchAbout();
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
        <div className="text-center text-red-600"><p>{error}</p></div>
      </div>
    );
  }

  // Convert core_values string into array
  const coreValues = about?.core_values
    ? about.core_values.split('\n').filter(v => v.trim())
    : [];

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">{about?.title || 'About Us'}</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              {about?.content && (
                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line mb-8">
                  {about.content}
                </p>
              )}

              {about?.mission && (
                <div id="mission" className="mb-6">
                  <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
                  <p className="text-gray-600 leading-relaxed">{about.mission}</p>
                </div>
              )}

              {about?.vision && (
                <div>
                  <h2 className="text-2xl font-bold mb-3">Our Vision</h2>
                  <p className="text-gray-600 leading-relaxed">{about.vision}</p>
                </div>
              )}
            </div>

            {coreValues.length > 0 && (
              <div className="bg-primary-600 rounded-xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Core Values</h3>
                <ul className="space-y-3">
                  {coreValues.map((value, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <span className="text-2xl">⭐</span>
                      <span className="leading-relaxed">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;