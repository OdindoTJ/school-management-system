import React, { useEffect, useState } from 'react';
import { libraryAPI } from '../../api/library';

const Overdue = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI.getOverdueLoans()
      .then((r) => setLoans(r.data.results || r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const daysOverdue = (due) => {
    const d = new Date(due);
    const today = new Date();
    return Math.max(0, Math.floor((today - d) / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overdue Loans</h1>
        <p className="text-gray-500 text-sm mt-1">Books past their due date (KES 10/day fine)</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">No overdue loans.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Book</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Borrower</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Due</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Days Late</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((l) => {
                const days = daysOverdue(l.due_date);
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{l.book_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{l.borrower_name}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{l.due_date}</td>
                    <td className="px-6 py-4 text-sm text-red-600 font-semibold">{days}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-700">KES {days * 10}</td>
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

export default Overdue;