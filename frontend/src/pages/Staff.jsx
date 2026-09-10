import React, { useState, useEffect } from 'react';
import { schoolsAPI } from '../api/schools';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await schoolsAPI.getLeadership();
        // Handle paginated response
        const data = response.data.results || response.data;
        setStaff(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching staff:', err);
        setError('Failed to load staff information.');
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Our Leadership</h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Meet the dedicated team leading our school towards excellence.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No staff members added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staff.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                    {member.photo ? (
                      <img
                        src={member.photo.startsWith('http') ? member.photo : `http://localhost:8000${member.photo}`}
                        alt={member.name}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 bg-primary-100 flex items-center justify-center">
                        <span className="text-6xl text-primary-400 font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                    <p className="text-primary-600 font-medium text-sm mb-2">{member.title}</p>
                    {member.bio && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {member.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="hover:text-primary-600 transition">
                          ✉️ {member.email}
                        </a>
                      )}
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="hover:text-primary-600 transition">
                          📞 {member.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Staff;