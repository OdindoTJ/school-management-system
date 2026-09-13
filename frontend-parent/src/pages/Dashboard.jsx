import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parentAPI } from '../api/parent';
import { useChild } from '../context/ChildContext';

const Dashboard = () => {
  const { selectedChild } = useChild();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [recentGrades, setRecentGrades] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!selectedChild) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [timetableRes, attendanceRes, gradesRes, assignmentsRes, announcementsRes] =
          await Promise.allSettled([
            parentAPI.getChildTimetable(selectedChild.id, { today: true }),
            parentAPI.getChildAttendanceSummary(selectedChild.id),
            parentAPI.getChildGrades(selectedChild.id),
            parentAPI.getChildAssignments(selectedChild.id),
            parentAPI.getChildAnnouncements(selectedChild.id),
          ]);

        if (timetableRes.status === 'fulfilled') {
          const data = timetableRes.value.data;
          setTodayClasses(Array.isArray(data) ? data : data.results || []);
        }
        if (attendanceRes.status === 'fulfilled') {
          setAttendanceSummary(attendanceRes.value.data);
        }
        if (gradesRes.status === 'fulfilled') {
          const data = gradesRes.value.data;
          const list = Array.isArray(data) ? data : data.results || [];
          setRecentGrades(list.slice(0, 5));
        }
        if (assignmentsRes.status === 'fulfilled') {
          const data = assignmentsRes.value.data;
          const list = Array.isArray(data) ? data : data.results || [];
          setUpcomingAssignments(list.slice(0, 3));
        }
        if (announcementsRes.status === 'fulfilled') {
          const data = announcementsRes.value.data;
          const list = Array.isArray(data) ? data : data.results || [];
          setAnnouncements(list.slice(0, 3));
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedChild]);

  if (!selectedChild) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-2">No child selected</h1>
        <p className="text-gray-500">
          Please select a child above, or contact the school if none are linked.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl p-6 sm:p-8 text-white">
        <p className="text-sm text-white/70 uppercase tracking-widest mb-1">
          Viewing
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {selectedChild.full_name}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          <span>Admission: <strong className="text-white">{selectedChild.admission_number}</strong></span>
          <span>Class: <strong className="text-white">{selectedChild.class_name || '—'}</strong></span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance"
          value={attendanceSummary?.attendance_percentage != null
            ? `${attendanceSummary.attendance_percentage}%` : '—'}
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          iconBg="bg-green-100"
        />
        <StatCard
          label="Grades Recorded"
          value={recentGrades.length}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          iconBg="bg-blue-100"
        />
        <StatCard
          label="Assignments"
          value={upcomingAssignments.length}
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          iconBg="bg-purple-100"
        />
        <StatCard
          label="Classes Today"
          value={todayClasses.length}
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBg="bg-amber-100"
        />
      </div>

      {/* Today's Timetable + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Today's Classes</h2>
            <Link to="/timetable" className="text-sm text-primary-900 font-medium hover:text-primary-700">
              Full timetable →
            </Link>
          </div>

          {todayClasses.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">
              No classes scheduled for today.
            </p>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="w-14 text-center flex-shrink-0">
                    <p className="text-sm font-bold text-primary-900">{cls.start_time?.slice(0, 5)}</p>
                    <p className="text-xs text-gray-500">{cls.end_time?.slice(0, 5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cls.subject_name}</p>
                    <p className="text-xs text-gray-500">
                      {cls.teacher_name || 'No teacher'} · Room {cls.room || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
            <Link to="/announcements" className="text-sm text-primary-900 font-medium hover:text-primary-700">
              View all →
            </Link>
          </div>

          {announcements.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No announcements.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="border-l-4 border-primary-900 pl-3">
                  <p className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">{a.title}</p>
                  <p className="text-xs text-gray-500">
                    {a.published_at ? new Date(a.published_at).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Grades + Upcoming Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Grades</h2>
            <Link to="/grades" className="text-sm text-primary-900 font-medium hover:text-primary-700">
              View all →
            </Link>
          </div>

          {recentGrades.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No grades recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentGrades.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{g.subject_name}</p>
                    <p className="text-xs text-gray-500">{g.exam_type_display}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-primary-900">{g.score}/{g.max_score}</p>
                    <p className="text-xs text-gray-500">Grade {g.grade_letter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Assignments</h2>
            <Link to="/assignments" className="text-sm text-primary-900 font-medium hover:text-primary-700">
              View all →
            </Link>
          </div>

          {upcomingAssignments.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No assignments due.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-gray-50">
                  <p className="font-medium text-sm text-gray-900 mb-1 truncate">{a.title}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{a.subject_name}</span>
                    <span className={a.is_overdue ? 'text-red-600 font-medium' : ''}>
                      {a.is_overdue ? 'Overdue' : `Due ${new Date(a.due_date).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, iconBg }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

export default Dashboard;