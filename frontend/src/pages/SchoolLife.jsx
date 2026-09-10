import React, { useState, useEffect } from 'react';
import { schoolsAPI } from '../api/schools';

const CategoryIcons = {
  sports: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  clubs: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  societies: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  facilities: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
    </svg>
  ),
};

const SchoolLife = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchoolLife = async () => {
      try {
        const response = await schoolsAPI.getSchoolLifeCategories();
        // Handle paginated response
        const data = response.data.results || response.data;
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching school life:', err);
        setError('Failed to load school life information.');
        setLoading(false);
      }
    };
    fetchSchoolLife();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading school life...</p>
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
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">School Life</h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Discover the vibrant extracurricular activities and facilities at our school.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No school life categories added yet.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-primary-600">
                      {CategoryIcons[category.category] || CategoryIcons.facilities}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{category.name}</h2>
                      {category.description && (
                        <p className="text-gray-600">{category.description}</p>
                      )}
                    </div>
                  </div>

                  {category.items && category.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category.items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                          {item.image ? (
                            <div className="aspect-video bg-gray-200">
                              <img
                                src={item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-primary-50 flex items-center justify-center">
                              {item.icon_svg ? (
                                <div dangerouslySetInnerHTML={{ __html: item.icon_svg }} className="w-16 h-16 text-primary-400" />
                              ) : (
                                <span className="text-4xl text-primary-300">📚</span>
                              )}
                            </div>
                          )}
                          <div className="p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No items in this category yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SchoolLife;