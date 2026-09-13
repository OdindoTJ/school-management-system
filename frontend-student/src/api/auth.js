import apiClient from './client';

export const studentAuthAPI = {
  login: (admission_number, password) =>
    apiClient.post('/students/auth/login/', { admission_number, password }),

  me: () => apiClient.get('/students/auth/me/'),

  changePassword: (old_password, new_password, confirm_password) =>
    apiClient.post('/students/auth/change-password/', {
      old_password,
      new_password,
      confirm_password,
    }),

  logout: () => {
    localStorage.removeItem('student_access_token');
    localStorage.removeItem('student_refresh_token');
    localStorage.removeItem('student_user');
  },
};

// Token helpers
export const setTokens = (access, refresh) => {
  localStorage.setItem('student_access_token', access);
  localStorage.setItem('student_refresh_token', refresh);
};

export const getAccessToken = () => localStorage.getItem('student_access_token');

export const getRefreshToken = () => localStorage.getItem('student_refresh_token');

export const setCurrentStudent = (student) => {
  localStorage.setItem('student_user', JSON.stringify(student));
};

export const getCurrentStudent = () => {
  const raw = localStorage.getItem('student_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('student_access_token');
};

export const mustChangePassword = () => {
  const student = getCurrentStudent();
  return student?.must_change_password === true;
};