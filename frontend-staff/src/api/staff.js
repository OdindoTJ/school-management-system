import apiClient from './client';

export const staffAPI = {
  // Profile
  getMe: () => apiClient.get('/staff/auth/me/'),

  // Staff members (admin)
  getStaffMembers: (params = {}) => apiClient.get('/staff/members/', { params }),
  getStaffMember: (id) => apiClient.get(`/staff/members/${id}/`),

  // Roles (admin)
  getRoles: () => apiClient.get('/staff/roles/'),
  getRole: (id) => apiClient.get(`/staff/roles/${id}/`),

  // Role assignments (admin)
  getRoleAssignments: (params = {}) =>
    apiClient.get('/staff/role-assignments/', { params }),
  createRoleAssignment: (data) =>
    apiClient.post('/staff/role-assignments/', data),
  deleteRoleAssignment: (id) =>
    apiClient.delete(`/staff/role-assignments/${id}/`),

  // Audit logs (admin)
  getAuditLogs: (params = {}) => apiClient.get('/staff/audit-logs/', { params }),

  // Change requests (approval workflow)
  getChangeRequests: (params = {}) =>
    apiClient.get('/staff/change-requests/', { params }),
  getChangeRequest: (id) => apiClient.get(`/staff/change-requests/${id}/`),
  createChangeRequest: (data) => apiClient.post('/staff/change-requests/', data),
  reviewChangeRequest: (id, decision, review_notes = '') =>
    apiClient.post(`/staff/change-requests/${id}/review/`, {
      decision,
      review_notes,
    }),

  // Admin actions
  forceLogout: (staffId) => apiClient.post(`/staff/admin/force-logout/${staffId}/`),
};