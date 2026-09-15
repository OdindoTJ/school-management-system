import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { studentsAPI } from '../../api/students';

const List = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [classId, setClassId] = useState(searchParams.get('class_id') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('active') || 'true');

  // Fetch classes for filter dropdown
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await studentsAPI.getClasses();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setClasses(data);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (search) params.search = search;
        if (classId) params.class_id = classId;
        if (activeFilter !== '') params.active = activeFilter;

        const res = await studentsAPI.list(params);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setStudents(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();

    // Update URL params
    const newParams = {};
    if (search) newParams.search = search;
    if (classId) newParams.class_id = classId;
    if (activeFilter !== '') newParams.active = activeFilter;
    setSearchParams(newParams, { replace: true });
  }, [search, classId, activeFilter, setSearchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            {students.length} {students.length === 1 ? 'student' : 'students'}
          </p>
        </div>
        <Link
          to="/students/new"
          className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold py-2.5 px-4 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label-field">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or admission number..."
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="input-field"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academic_year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">Status</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="input-field"
            >
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
              <option value="">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-100">
          <div className="w-10 h-10 border-4 border-primary-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          {error}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No students found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Admission No.</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Class</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Parents</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {s.photo_url ? (
                        <img
                          src={s.photo_url}
                          alt={s.full_name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs font-bold">
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{s.full_name}</p>
                        <p className="text-xs text-gray-500 md:hidden">{s.admission_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 hidden md:table-cell">
                    {s.admission_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 hidden lg:table-cell">
                    {s.class_name || <span className="text-gray-400">Not assigned</span>}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700 hidden lg:table-cell">
                    {s.parent_count > 0 ? (
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {s.parent_count}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {s.is_active ? (
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/students/${s.id}`}
                      className="text-sm text-primary-900 hover:text-primary-700 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default List;