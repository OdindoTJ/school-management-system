import React, { useState, useEffect } from 'react';
import { studentAPI } from '../api/student';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // all | upcoming | overdue

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await studentAPI.getAssignments();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setAssignments(data);
      } catch (err) {
        console.error('Assignments fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const filtered = assignments.filter((a) => {
    if (tab === 'upcoming') return !a.is_overdue;
    if (tab === 'overdue') return a.is_overdue;
    return true;
  });

  const counts = {
    all: assignments.length,
    upcoming: assignments.filter((a) => !a.is_overdue).length,
    overdue: assignments.filter((a) => a.is_overdue).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-500 text-sm mt-1">All assignments for your class</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'overdue', label: 'Overdue' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              tab === t.key
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No assignments in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  a.is_overdue ? 'bg-red-100' : 'bg-primary-50'
                }`}>
                  <svg className={`w-6 h-6 ${a.is_overdue ? 'text-red-600' : 'text-primary-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{a.title}</h3>
                    {a.is_overdue && (
                      <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{a.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>📘 {a.subject_name}</span>
                    {a.teacher_name && <span>👤 {a.teacher_name}</span>}
                    <span>📅 Due: {new Date(a.due_date).toLocaleString()}</span>
                  </div>
                </div>

                {a.attachment && (
                  <a
                    href={a.attachment.startsWith('http') ? a.attachment : `http://localhost:8000${a.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                    title="Download attachment"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assignments;