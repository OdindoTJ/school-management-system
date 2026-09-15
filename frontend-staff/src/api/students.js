import apiClient from './client';

export const studentsAPI = {
  // List + filters
  list: (params = {}) => apiClient.get('/students/admin/', { params }),

  // Detail
  get: (id) => apiClient.get(`/students/admin/${id}/`),

  // Create
  create: (data) => apiClient.post('/students/admin/', data),

  // Update
  update: (id, data) => apiClient.patch(`/students/admin/${id}/`, data),

  // Actions
  deactivate: (id, reason) =>
    apiClient.post(`/students/admin/${id}/deactivate/`, { reason }),

  reactivate: (id) =>
    apiClient.post(`/students/admin/${id}/reactivate/`),

  resetPassword: (id) =>
    apiClient.post(`/students/admin/${id}/reset-password/`),

  // Reference data
  getClasses: () => apiClient.get('/schools/classes/'),
};