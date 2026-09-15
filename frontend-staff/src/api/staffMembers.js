import apiClient from './client';

export const staffAPI = {
  // Profile (logged-in staff)
  getMe: () => apiClient.get('/staff/auth/me/'),

  // ============================================================
  // Staff members (admin)
  // ============================================================
  getStaffMembers: (params = {}) => apiClient.get('/staff/members/', { params }),
  getStaffMember: (id) => apiClient.get(`/staff/members/${id}/`),
  createStaffMember: (data) => apiClient.post('/staff/members/', data),
  updateStaffMember: (id, data) => apiClient.patch(`/staff/members/${id}/`, data),

  // Staff actions
  deactivateStaff: (id, reason) =>
    apiClient.post(`/staff/members/${id}/deactivate/`, { reason }),
  reactivateStaff: (id) =>
    apiClient.post(`/staff/members/${id}/reactivate/`),
  resetStaffPassword: (id) =>
    apiClient.post(`/staff/members/${id}/reset-password/`),
  forceLogoutStaffMember: (id) =>
    apiClient.post(`/staff/members/${id}/force-logout/`),

  // Role management on a specific staff member
  assignRole: (staffId, roleId) =>
    apiClient.post(`/staff/members/${staffId}/assign-role/`, { role_id: roleId }),
  removeRole: (staffId, roleId) =>
    apiClient.post(`/staff/members/${staffId}/remove-role/`, { role_id: roleId }),

  // ============================================================
  // Roles (admin)
  // ============================================================
  getRoles: () => apiClient.get('/staff/roles/'),
  getRole: (id) => apiClient.get(`/staff/roles/${id}/`),

  // ============================================================
  // Role assignments (admin)
  // ============================================================
  getRoleAssignments: (params = {}) =>
    apiClient.get('/staff/role-assignments/', { params }),
  createRoleAssignment: (data) =>
    apiClient.post('/staff/role-assignments/', data),
  deleteRoleAssignment: (id) =>
    apiClient.delete(`/staff/role-assignments/${id}/`),

  // ============================================================
  // Audit logs (admin)
  // ============================================================
  getAuditLogs: (params = {}) => apiClient.get('/staff/audit-logs/', { params }),

  // ============================================================
  // Change requests (approval workflow)
  // ============================================================
  getChangeRequests: (params = {}) =>
    apiClient.get('/staff/change-requests/', { params }),
  getChangeRequest: (id) => apiClient.get(`/staff/change-requests/${id}/`),
  createChangeRequest: (data) => apiClient.post('/staff/change-requests/', data),
  reviewChangeRequest: (id, decision, review_notes = '') =>
    apiClient.post(`/staff/change-requests/${id}/review/`, {
      decision,
      review_notes,
    }),

  // ============================================================
  // Legacy admin force-logout (kept for compatibility)
  // ============================================================
  forceLogout: (staffId) => apiClient.post(`/staff/admin/force-logout/${staffId}/`),
};