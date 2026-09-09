import React, { useState, useEffect } from 'react';

const News = () => {
  const [news, setNews] = useState([
    {
      id: 1,
      title: 'School Receives Award for Academic Excellence',
      excerpt: 'Our school has been recognized for outstanding academic performance in the national examinations.',
      date: '2024-11-15',
      category: 'Achievement'
    },
    {
      id: 2,
      title: 'Annual Sports Day Announced',
      excerpt: 'Join us for our annual sports day celebration featuring various athletic competitions.',
      date: '2024-11-10',
      category: 'Events'
    },
    {
      id: 3,
      title: 'New Library and Resource Center Opening',
      excerpt: 'We are excited to announce the opening of our new state-of-the-art library facility.',
      date: '2024-11-05',
      category: 'Facilities'
    }
  ]);

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold text-center mb-4">News & Announcements</h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Stay updated with the latest news and events from our school community.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {news.map((item) => (
              <div key={item.id} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-4">{item.excerpt}</p>
                  <a href="#" className="text-primary-600 font-medium hover:text-primary-700">
                    Read More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default News;