import apiClient from './client';

export const authAPI = {
  register: (userData) => apiClient.post('/accounts/register/', userData),
  
  login: (credentials) => apiClient.post('/accounts/login/', credentials),
  
  logout: () => apiClient.post('/accounts/logout/'),
  
  getProfile: () => apiClient.get('/accounts/profile/'),
  
  updateProfile: (data) => apiClient.patch('/accounts/profile/', data),
  
  changePassword: (data) => apiClient.post('/accounts/change-password/', data),
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};