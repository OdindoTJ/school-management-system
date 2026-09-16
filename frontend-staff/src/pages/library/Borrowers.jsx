import React, { useEffect, useState } from 'react';
import { libraryAPI } from '../../api/library';

const Borrowers = () => {
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI.getBorrowers()
      .then((r) => setBorrowers(r.data.results || r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Borrowers</h1>
        <p className="text-gray-500 text-sm mt-1">Registered students and staff</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : borrowers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">No borrowers registered yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Card No.</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {borrowers.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm text-gray-900">{b.library_card_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.borrower_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.borrower_type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {b.is_active ? 'Active' : 'Inactive'}
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

export default Borrowers;