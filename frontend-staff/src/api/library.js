import apiClient from './client';

export const libraryAPI = {
  // Books
  getBooks: (params = {}) => apiClient.get('/library/books/', { params }),
  getBook: (id) => apiClient.get(`/library/books/${id}/`),
  createBook: (data) => apiClient.post('/library/books/', data),
  updateBook: (id, data) => apiClient.patch(`/library/books/${id}/`, data),
  deleteBook: (id) => apiClient.delete(`/library/books/${id}/`),
  getAvailableBooks: () => apiClient.get('/library/books/available/'),

  // Categories
  getCategories: () => apiClient.get('/library/categories/'),

  // Borrowers
  getBorrowers: (params = {}) => apiClient.get('/library/borrowers/', { params }),
  createBorrower: (data) => apiClient.post('/library/borrowers/', data),

  // Loans
  getLoans: (params = {}) => apiClient.get('/library/loans/', { params }),
  createLoan: (data) => apiClient.post('/library/loans/', data),
  returnBook: (id) => apiClient.post(`/library/loans/${id}/return_book/`),
  renewLoan: (id) => apiClient.post(`/library/loans/${id}/renew/`),
  getOverdueLoans: () => apiClient.get('/library/loans/overdue/'),

  // Fines
  getFines: (params = {}) => apiClient.get('/library/fines/', { params }),
  payFine: (id) => apiClient.patch(`/library/fines/${id}/`, { paid: true }),
};