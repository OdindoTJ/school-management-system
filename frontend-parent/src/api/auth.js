import apiClient from './client';
// Children are cached in ChildContext — no extra work needed here.
export const parentAuthAPI = {
  login: (email, password) =>
    apiClient.post('/parents/auth/login/', { email, password }),

  me: () => apiClient.get('/parents/auth/me/'),

  changePassword: (old_password, new_password, confirm_password) =>
    apiClient.post('/parents/auth/change-password/', {
      old_password,
      new_password,
      confirm_password,
    }),

  // Invitation flow (public)
  validateInvitation: (token) =>
    apiClient.get(`/parents/invitations/${token}/`),

  acceptInvitation: (token, data) =>
    apiClient.post(`/parents/invitations/${token}/accept/`, data),

  logout: () => {
    localStorage.removeItem('parent_access_token');
    localStorage.removeItem('parent_refresh_token');
    localStorage.removeItem('parent_user');
    localStorage.removeItem('parent_selected_child');
  },
};

// Token helpers
export const setTokens = (access, refresh) => {
  localStorage.setItem('parent_access_token', access);
  localStorage.setItem('parent_refresh_token', refresh);
};

export const getAccessToken = () => localStorage.getItem('parent_access_token');
export const getRefreshToken = () => localStorage.getItem('parent_refresh_token');

export const setCurrentParent = (parent) => {
  localStorage.setItem('parent_user', JSON.stringify(parent));
};

export const getCurrentParent = () => {
  const raw = localStorage.getItem('parent_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const isAuthenticated = () => !!localStorage.getItem('parent_access_token');
