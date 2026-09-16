import apiClient from './client';

export const studentAPI = {
  getProfile: () => apiClient.get('/students/auth/me/'),
  getGrades: (params = {}) => apiClient.get('/students/me/grades/', { params }),
  getReportCard: (termId) =>
    apiClient.get('/students/me/grades/report-card/', {
      params: termId ? { term: termId } : {},
    }),
  getTimetable: (params = {}) => apiClient.get('/students/me/timetable/', { params }),
  getTodayTimetable: () => apiClient.get('/students/me/timetable/', { params: { today: true } }),
  getAttendance: (params = {}) => apiClient.get('/students/me/attendance/', { params }),
  getAttendanceSummary: (params = {}) =>
    apiClient.get('/students/me/attendance/summary/', { params }),
  getAssignments: (params = {}) => apiClient.get('/students/me/assignments/', { params }),
  getLibrary: () => apiClient.get('/library/loans/my-loans/'),   // ← FIXED
  getClubs: () => apiClient.get('/students/me/clubs/'),
  getSports: () => apiClient.get('/students/me/sports/'),
  getAnnouncements: () => apiClient.get('/schools/announcements/'),
  getTerms: () => apiClient.get('/schools/academic-terms/'),
};