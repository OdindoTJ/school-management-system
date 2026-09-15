import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { staffAPI } from '../../api/staffMembers';

const List = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('active') || 'true');
  const [employmentFilter, setEmploymentFilter] = useState(searchParams.get('employment_type') || '');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await staffAPI.getRoles();
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setRoles(data);
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (search) params.search = search;
        if (roleFilter) params.role = roleFilter;
        if (activeFilter !== '') params.active = activeFilter;
        if (employmentFilter) params.employment_type = employmentFilter;

        const res = await staffAPI.getStaffMembers(params);
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setStaff(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load staff.');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();

    const newParams = {};
    if (search) newParams.search = search;
    if (roleFilter) newParams.role = roleFilter;
    if (activeFilter !== '') newParams.active = activeFilter;
    if (employmentFilter) newParams.employment_type = employmentFilter;
    setSearchParams(newParams, { replace: true });
  }, [search, roleFilter, activeFilter, employmentFilter, setSearchParams]);

  const roleBadgeColor = (slug) => {
    switch (slug) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'principal': return 'bg-purple-100 text-purple-700';
      case 'deputy_principal': return 'bg-indigo-100 text-indigo-700';
      case 'hod': return 'bg-blue-100 text-blue-700';
      case 'bursar': return 'bg-amber-100 text-amber-700';
      case 'librarian': return 'bg-green-100 text-green-700';
      case 'teacher': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Members</h1>
          <p className="text-gray-500 text-sm mt-1">
            {staff.length} {staff.length === 1 ? 'staff member' : 'staff members'}
          </p>
        </div>
        <Link
          to="/staff/new"
          className="inline-flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white font-semibold py-2.5 px-4 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </Link>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="label-field">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, ID, email..."
              className="input-field"
            />
          </div>

          <div>
            <label className="label-field">Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field">
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.slug}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">Employment</label>
            <select value={employmentFilter} onChange={(e) => setEmploymentFilter(e.target.value)} className="input-field">
              <option value="">All Types</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
              <option value="part_time">Part-Time</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>

          <div>
            <label className="label-field">Status</label>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="input-field">
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
              <option value="">All</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-100">
          <div className="w-10 h-10 border-4 border-primary-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">{error}</div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No staff members found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Staff</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Staff ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Roles</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Employment</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((s) => {
                const initials = s.full_name
                  ? s.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                  : '?';
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt={s.full_name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs font-bold">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{s.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 hidden md:table-cell">
                      {s.staff_id}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {s.roles && s.roles.length > 0 ? (
                          s.roles.map((r) => (
                            <span
                              key={r.id}
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor(r.slug)}`}
                            >
                              {r.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No role</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 hidden lg:table-cell">
                      <span className="capitalize">{s.employment_type?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {s.is_active ? (
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/staff/${s.id}`} className="text-sm text-primary-900 hover:text-primary-700 font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default List;