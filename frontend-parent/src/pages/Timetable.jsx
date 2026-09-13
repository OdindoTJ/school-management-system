import React, { useState, useEffect } from 'react';
import { parentAPI } from '../api/parent';
import { useChild } from '../context/ChildContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { selectedChild } = useChild();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');

  useEffect(() => {
    if (!selectedChild) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await parentAPI.getChildTimetable(selectedChild.id);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setEntries(data);
      } catch (err) {
        console.error('Timetable fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedChild]);

  const byDay = DAYS.reduce((acc, _, idx) => {
    acc[idx] = entries
      .filter((e) => e.day_of_week === idx)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    return acc;
  }, {});

  const todayIdx = new Date().getDay();
  const todayIndex = todayIdx === 0 ? -1 : todayIdx - 1;

  if (!selectedChild) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <p className="text-gray-500">Please select a child above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-gray-500 text-sm mt-1">{selectedChild.full_name}'s weekly schedule</p>
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              view === 'grid' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              view === 'list' ? 'bg-white text-primary-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No timetable entries yet.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {DAYS.map((day, idx) => (
            <div
              key={day}
              className={`bg-white rounded-2xl shadow-sm border p-5 ${
                idx === todayIndex ? 'border-primary-900 ring-2 ring-primary-900/10' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{day}</h3>
                {idx === todayIndex && (
                  <span className="text-xs font-semibold text-primary-900 bg-primary-50 px-2 py-0.5 rounded">
                    Today
                  </span>
                )}
              </div>

              {byDay[idx].length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No classes</p>
              ) : (
                <div className="space-y-2">
                  {byDay[idx].map((entry) => (
                    <div key={entry.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm text-gray-900">{entry.subject_name}</p>
                        <p className="text-xs text-gray-500">
                          {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {entry.teacher_name || 'No teacher'} · Room {entry.room || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day, idx) =>
            byDay[idx].length > 0 && (
              <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`px-6 py-3 border-b border-gray-100 ${
                  idx === todayIndex ? 'bg-primary-50' : 'bg-gray-50'
                }`}>
                  <h3 className="font-bold text-gray-900">{day}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {byDay[idx].map((entry) => (
                    <div key={entry.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition">
                      <div className="w-24 flex-shrink-0">
                        <p className="text-sm font-bold text-primary-900">{entry.start_time.slice(0, 5)}</p>
                        <p className="text-xs text-gray-500">{entry.end_time.slice(0, 5)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{entry.subject_name}</p>
                        <p className="text-xs text-gray-500">
                          {entry.teacher_name || 'No teacher'} · Room {entry.room || '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Timetable;