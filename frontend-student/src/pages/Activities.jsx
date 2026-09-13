import React, { useState, useEffect } from 'react';
import { studentAPI } from '../api/student';

const Activities = () => {
  const [clubs, setClubs] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('clubs');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clubsRes, sportsRes] = await Promise.all([
          studentAPI.getClubs(),
          studentAPI.getSports(),
        ]);
        setClubs(Array.isArray(clubsRes.data) ? clubsRes.data : clubsRes.data.results || []);
        setSports(Array.isArray(sportsRes.data) ? sportsRes.data : sportsRes.data.results || []);
      } catch (err) {
        console.error('Activities fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const currentList = tab === 'clubs' ? clubs : sports;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clubs & Sports</h1>
        <p className="text-gray-500 text-sm mt-1">Activities you're part of</p>
      </div>

      <div className="flex items-center bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('clubs')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition ${
            tab === 'clubs' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-600'
          }`}
        >
          Clubs ({clubs.length})
        </button>
        <button
          onClick={() => setTab('sports')}
          className={`px-5 py-2 text-sm font-medium rounded-md transition ${
            tab === 'sports' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-600'
          }`}
        >
          Sports ({sports.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">You are not a member of any {tab} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tab === 'clubs' && clubs.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">{m.club.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{m.club.description}</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p><strong className="text-gray-700">Role:</strong> {m.role_display}</p>
                    {m.club.meeting_day && <p><strong className="text-gray-700">Meets:</strong> {m.club.meeting_day} {m.club.meeting_time?.slice(0, 5)}</p>}
                    {m.club.meeting_location && <p><strong className="text-gray-700">Location:</strong> {m.club.meeting_location}</p>}
                    {m.club.patron_name && <p><strong className="text-gray-700">Patron:</strong> {m.club.patron_name}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {tab === 'sports' && sports.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">{m.sport.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{m.sport.description}</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    {m.sport.season && <p><strong className="text-gray-700">Season:</strong> {m.sport.season}</p>}
                    {m.sport.training_days && <p><strong className="text-gray-700">Training:</strong> {m.sport.training_days} {m.sport.training_time?.slice(0, 5)}</p>}
                    {m.sport.training_location && <p><strong className="text-gray-700">Location:</strong> {m.sport.training_location}</p>}
                    {m.sport.coach_name && <p><strong className="text-gray-700">Coach:</strong> {m.sport.coach_name}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Activities;