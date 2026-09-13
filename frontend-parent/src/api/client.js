import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parent_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 with refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('parent_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccess = res.data.access;
          localStorage.setItem('parent_access_token', newAccess);

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('parent_access_token');
          localStorage.removeItem('parent_refresh_token');
          localStorage.removeItem('parent_user');

          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;