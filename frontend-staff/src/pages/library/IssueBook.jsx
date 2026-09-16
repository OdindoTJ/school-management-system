import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { libraryAPI } from '../../api/library';

const IssueBook = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [form, setForm] = useState({ book: '', borrower: '', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [b, br] = await Promise.all([
        libraryAPI.getAvailableBooks(),
        libraryAPI.getBorrowers({ is_active: true }),
      ]);
      setBooks(b.data.results || b.data);
      setBorrowers(br.data.results || br.data);
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await libraryAPI.createLoan({
        book: form.book,
        borrower: form.borrower,
        status: 'BORROWED',
        notes: form.notes,
      });
      navigate('/library/loans');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to issue book');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Issue Book</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new loan (7-day due date)</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
          <select required value={form.book} onChange={(e) => setForm({ ...form, book: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">-- Select an available book --</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Borrower</label>
          <select required value={form.borrower} onChange={(e) => setForm({ ...form, borrower: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">-- Select a borrower --</option>
            {borrowers.map((br) => (
              <option key={br.id} value={br.id}>{br.library_card_number} — {br.borrower_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary px-6 py-2 rounded-lg">
            {submitting ? 'Issuing...' : 'Issue Book'}
          </button>
          <button type="button" onClick={() => navigate('/library')} className="px-6 py-2 rounded-lg border border-gray-300">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default IssueBook;