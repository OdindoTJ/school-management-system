import React, { useState, useEffect } from 'react';
import { studentAPI } from '../api/student';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;

      const [recordsRes, summaryRes] = await Promise.all([
        studentAPI.getAttendance(params),
        studentAPI.getAttendanceSummary(params),
      ]);

      const list = Array.isArray(recordsRes.data)
        ? recordsRes.data
        : recordsRes.data.results || [];
      setRecords(list);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Attendance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleClear = () => {
    setFilterFrom('');
    setFilterTo('');
    setTimeout(fetchData, 0);
  };

  const statusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent': return 'bg-red-100 text-red-700';
      case 'late': return 'bg-amber-100 text-amber-700';
      case 'excused': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Your attendance records and summary</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Attendance %" value={`${summary.attendance_percentage}%`} highlight />
          <StatCard label="Total Days" value={summary.total_days} />
          <StatCard label="Present" value={summary.present} color="text-green-600" />
          <StatCard label="Absent" value={summary.absent} color="text-red-600" />
          <StatCard label="Late / Excused" value={`${summary.late} / ${summary.excused}`} />
        </div>
      )}

      {/* Filter */}
      <form onSubmit={handleFilter} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="label-field">From</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex-1">
            <label className="label-field">To</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Filter</button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Records */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No attendance records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor(r.status)}`}>
                      {r.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                    {r.reason || '—'}
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

const StatCard = ({ label, value, color = 'text-gray-900', highlight = false }) => (
  <div className={`bg-white rounded-2xl p-4 shadow-sm border ${highlight ? 'border-primary-900 ring-2 ring-primary-900/10' : 'border-gray-100'}`}>
    <p className={`text-2xl font-bold ${highlight ? 'text-primary-900' : color}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

export default Attendance;