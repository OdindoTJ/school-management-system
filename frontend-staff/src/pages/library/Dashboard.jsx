import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryAPI } from '../../api/library';

const LibraryDashboard = () => {
  const [stats, setStats] = useState({ books: 0, available: 0, loans: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [books, available, loans, overdue] = await Promise.all([
          libraryAPI.getBooks(),
          libraryAPI.getAvailableBooks(),
          libraryAPI.getLoans({ status: 'BORROWED' }),
          libraryAPI.getOverdueLoans(),
        ]);
        const count = (r) => r.data.count ?? r.data.length ?? 0;
        setStats({
          books: count(books),
          available: count(available),
          loans: count(loans),
          overdue: count(overdue),
        });
      } catch (err) {
        console.error('Library dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Books', value: stats.books, color: 'bg-blue-50 text-blue-700', icon: '📚' },
    { label: 'Available', value: stats.available, color: 'bg-green-50 text-green-700', icon: '✅' },
    { label: 'Active Loans', value: stats.loans, color: 'bg-yellow-50 text-yellow-700', icon: '📖' },
    { label: 'Overdue', value: stats.overdue, color: 'bg-red-50 text-red-700', icon: '⚠️' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Library</h1>
        <p className="text-gray-500 text-sm mt-1">Manage books, loans, and borrowers</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${c.color}`}>
                  {c.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-3">{c.value}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/library/new" className="btn-primary text-center py-3 rounded-xl text-sm">➕ Issue Book</Link>
              <Link to="/library/return" className="btn-primary text-center py-3 rounded-xl text-sm">↩️ Return Book</Link>
              <Link to="/books/new" className="btn-primary text-center py-3 rounded-xl text-sm">📖 Add Book</Link>
              <Link to="/library/overdue" className="btn-primary text-center py-3 rounded-xl text-sm">⚠️ View Overdue</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/books" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">Books Inventory</h3>
              <p className="text-sm text-gray-500 mt-1">View, add, and edit all books</p>
            </Link>
            <Link to="/library/loans" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">Active Loans</h3>
              <p className="text-sm text-gray-500 mt-1">All currently borrowed books</p>
            </Link>
            <Link to="/borrowers" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-gray-900">Borrowers</h3>
              <p className="text-sm text-gray-500 mt-1">Registered students and staff</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default LibraryDashboard;