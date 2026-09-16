import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { libraryAPI } from '../../api/library';

const BookNew = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', publisher: '',
    year_published: '', category: '', description: '', shelf_location: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    libraryAPI.getCategories()
      .then((r) => setCategories(r.data.results || r.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await libraryAPI.createBook({
        ...form,
        category: form.category || null,
        year_published: form.year_published || null,
        is_available: true,
      });
      navigate('/books');
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Failed to create book'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add Book</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        {[
          ['title', 'Title', true],
          ['author', 'Author', true],
          ['isbn', 'ISBN', true],
          ['publisher', 'Publisher', false],
          ['year_published', 'Year Published', false],
          ['shelf_location', 'Shelf Location', false],
        ].map(([name, label, required]) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={name === 'year_published' ? 'number' : 'text'}
              required={required}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">-- None --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary px-6 py-2 rounded-lg">
            {submitting ? 'Saving...' : 'Save Book'}
          </button>
          <button type="button" onClick={() => navigate('/books')} className="px-6 py-2 rounded-lg border border-gray-300">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookNew;