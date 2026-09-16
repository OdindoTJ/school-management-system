import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { libraryAPI } from '../../api/library';

const ReturnBook = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await libraryAPI.getLoans({ status: 'BORROWED' });
      setLoans(res.data.results || res.data);
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await libraryAPI.returnBook(selected);
      setMessage(
        `Book returned successfully.${res.data.days_late ? ` Fine: KES ${res.data.days_late * 10}` : ''}`
      );
      const fresh = await libraryAPI.getLoans({ status: 'BORROWED' });
      setLoans(fresh.data.results || fresh.data);
      setSelected('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to return book');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Return Book</h1>
        <p className="text-gray-500 text-sm mt-1">Log a book return and calculate fines</p>
      </div>

      {message && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Active Loan</label>
          <select
            required
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">-- Select a book to return --</option>
            {loans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.book_title} — {l.borrower_name} (Due: {l.due_date})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary px-6 py-2 rounded-lg">
            {submitting ? 'Returning...' : 'Return Book'}
          </button>
          <button type="button" onClick={() => navigate('/library')} className="px-6 py-2 rounded-lg border border-gray-300">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnBook;