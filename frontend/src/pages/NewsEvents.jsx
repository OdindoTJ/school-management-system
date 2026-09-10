import React, { useState, useEffect } from 'react';
import { schoolsAPI } from '../api/schools';

const NewsEvents = () => {
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('news');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [newsRes, eventsRes] = await Promise.all([
          schoolsAPI.getNews(),
          schoolsAPI.getUpcomingEvents(),
        ]);
        
        // Handle paginated responses
        const newsData = newsRes.data.results || newsRes.data;
        const eventsData = eventsRes.data.results || eventsRes.data;
        
        setNews(Array.isArray(newsData) ? newsData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news/events:', err);
        setError('Failed to load news and events.');
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading news & events...</p>
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
      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">News & Events</h1>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            Stay updated with the latest news and upcoming events at our school.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-8 border-b border-gray-200">
        <div className="container-custom">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                activeTab === 'news'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📰 News ({news.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                activeTab === 'events'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📅 Events ({events.length})
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container-custom">
          {activeTab === 'news' ? (
            news.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No news articles published yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {news.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all">
                    {item.image && (
                      <div className="aspect-video bg-gray-200">
                        <img
                          src={item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        {item.category && (
                          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {item.category}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(item.published_at).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {item.excerpt || (item.content && item.content.substring(0, 150) + '...')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No upcoming events scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all border-l-4 border-primary-500">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary-100 rounded-xl p-3 min-w-[80px] text-center">
                          <div className="text-2xl font-bold text-primary-700">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="text-xs text-primary-600 font-medium">
                            {new Date(event.date).toLocaleString('en-KE', { month: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>🕐 {event.time} {event.end_time && `- ${event.end_time}`}</p>
                            <p>📍 {event.location}</p>
                          </div>
                          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                            {event.description}
                          </p>
                          {event.is_featured && (
                            <span className="inline-block mt-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
};

export default NewsEvents;