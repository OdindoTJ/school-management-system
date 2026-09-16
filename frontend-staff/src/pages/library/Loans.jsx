import React, { useEffect, useState } from 'react';
import { libraryAPI } from '../../api/library';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI.getLoans()
      .then((r) => setLoans(r.data.results || r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
        <p className="text-gray-500 text-sm mt-1">All book loans</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">No loans found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Book</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Borrower</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Borrowed</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Due</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{l.book_title}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{l.borrower_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{l.borrowed_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{l.due_date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {l.status_display || l.status}
                    </span>
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

export default Loans;