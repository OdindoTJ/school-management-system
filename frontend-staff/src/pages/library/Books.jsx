import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { libraryAPI } from '../../api/library';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI.getBooks()
      .then((r) => setBooks(r.data.results || r.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Books</h1>
          <p className="text-gray-500 text-sm mt-1">Library inventory</p>
        </div>
        <Link to="/books/new" className="btn-primary px-4 py-2 rounded-lg text-sm">➕ Add Book</Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-gray-500">No books yet. Add your first book.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Author</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">ISBN</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {books.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{b.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.author}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.isbn}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${b.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {b.is_available ? 'Yes' : 'No'}
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

export default Books;