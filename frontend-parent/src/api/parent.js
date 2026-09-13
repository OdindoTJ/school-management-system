import apiClient from './client';

export const parentAPI = {
  // Children
  getChildren: () => apiClient.get('/parents/me/children/'),
  getChild: (studentId) => apiClient.get(`/parents/me/children/${studentId}/`),

  // Child data
  getChildGrades: (studentId, params = {}) =>
    apiClient.get(`/parents/me/children/${studentId}/grades/`, { params }),

  getChildReportCard: (studentId, termId) =>
    apiClient.get(`/parents/me/children/${studentId}/report-card/`, {
      params: termId ? { term: termId } : {},
    }),

  getChildTimetable: (studentId, params = {}) =>
    apiClient.get(`/parents/me/children/${studentId}/timetable/`, { params }),

  getChildAttendance: (studentId, params = {}) =>
    apiClient.get(`/parents/me/children/${studentId}/attendance/`, { params }),

  getChildAttendanceSummary: (studentId, params = {}) =>
    apiClient.get(`/parents/me/children/${studentId}/attendance/summary/`, { params }),

  getChildAssignments: (studentId, params = {}) =>
    apiClient.get(`/parents/me/children/${studentId}/assignments/`, { params }),

  getChildLibrary: (studentId) =>
    apiClient.get(`/parents/me/children/${studentId}/library/`),

  getChildActivities: (studentId) =>
    apiClient.get(`/parents/me/children/${studentId}/activities/`),

  getChildAnnouncements: (studentId) =>
    apiClient.get(`/parents/me/children/${studentId}/announcements/`),

  // Linking
  selfLinkChild: (data) => apiClient.post('/parents/link/self/', data),
  inviteCoparent: (data) => apiClient.post('/parents/link/invite-coparent/', data),
  resendInvitation: (invitationId) =>
    apiClient.post(`/parents/link/resend-invitation/${invitationId}/`),

  // Shared
  getTerms: () => apiClient.get('/schools/academic-terms/'),
};