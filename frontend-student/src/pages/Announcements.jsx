import React, { useState, useEffect } from 'react';
import { studentAPI } from '../api/student';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await studentAPI.getAnnouncements();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAnnouncements(data);
      } catch (err) {
        console.error('Announcements fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const priorityStyle = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-amber-500 bg-amber-50';
      default: return 'border-primary-900 bg-white';
    }
  };

  const priorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-amber-100 text-amber-700';
      default: return 'bg-primary-50 text-primary-900';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-500 text-sm mt-1">Latest school announcements</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl p-6 border-l-4 shadow-sm ${priorityStyle(a.priority)}`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{a.title}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${priorityBadge(a.priority)}`}>
                  {a.priority_display}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-3">
                {a.content}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Published: {new Date(a.published_at).toLocaleDateString()}</span>
                {a.expires_at && <span>Expires: {new Date(a.expires_at).toLocaleDateString()}</span>}
                <span>Audience: {a.audience_display}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;