import apiClient from './client';

export const staffAuthAPI = {
  login: (email, password, mfa_code = '') =>
    apiClient.post('/staff/auth/login/', { email, password, mfa_code }),

  me: () => apiClient.get('/staff/auth/me/'),

  logout: () => apiClient.post('/staff/auth/logout/'),

  changePassword: (old_password, new_password, confirm_password) =>
    apiClient.post('/staff/auth/change-password/', {
      old_password,
      new_password,
      confirm_password,
    }),

  forceLogout: (staffId) =>
    apiClient.post(`/staff/admin/force-logout/${staffId}/`),
};

// Token helpers
export const setTokens = (access, refresh) => {
  localStorage.setItem('staff_access_token', access);
  localStorage.setItem('staff_refresh_token', refresh);
};

export const getAccessToken = () => localStorage.getItem('staff_access_token');
export const getRefreshToken = () => localStorage.getItem('staff_refresh_token');

export const setCurrentStaff = (staff) => {
  localStorage.setItem('staff_user', JSON.stringify(staff));
};

export const getCurrentStaff = () => {
  const raw = localStorage.getItem('staff_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const isAuthenticated = () => !!localStorage.getItem('staff_access_token');

export const clearAuth = () => {
  localStorage.removeItem('staff_access_token');
  localStorage.removeItem('staff_refresh_token');
  localStorage.removeItem('staff_user');
};