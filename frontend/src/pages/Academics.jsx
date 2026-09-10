import React, { useState, useEffect } from 'react';
import { schoolsAPI } from '../api/schools';

const Academics = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await schoolsAPI.getAcademics();
        const data = response.data.results || response.data;
        setPrograms(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching academics:', err);
        setError('Failed to load academic programs.');
        setLoading(false);
      }
    };
    fetchPrograms();
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

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Academics</h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Explore our comprehensive academic programs designed to nurture excellence.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          {programs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No academic programs added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {programs.map((program) => {
                const subjects = program.subjects
                  ? program.subjects.split('\n').filter(s => s.trim())
                  : [];

                return (
                  <div key={program.id} className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all">
                    <div className="flex flex-col md:flex-row gap-8">
                      {program.image && (
                        <div className="md:w-1/3">
                          <img
                            src={program.image.startsWith('http') ? program.image : `http://localhost:8000${program.image}`}
                            alt={program.name}
                            className="w-full h-48 object-cover rounded-xl"
                          />
                        </div>
                      )}
                      <div className={program.image ? 'md:w-2/3' : 'w-full'}>
                        <h2 className="text-2xl font-bold text-primary-600 mb-2">{program.name}</h2>
                        <p className="text-sm text-gray-500 mb-3">{program.level_display || program.level}</p>
                        <p className="text-gray-600 mb-4 leading-relaxed">{program.description}</p>
                        {subjects.length > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2 text-sm text-gray-700">Core Subjects:</h3>
                            <div className="flex flex-wrap gap-2">
                              {subjects.map((subject, idx) => (
                                <span key={idx} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs">
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Academics;