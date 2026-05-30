import apiClient from './api';

export const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),

  linkedinAuth: (code, state) => apiClient.post('/auth/linkedin/callback', { code, state }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getMe: () => apiClient.get('/auth/me'),

  setToken: (token) => localStorage.setItem('token', token),

  getToken: () => localStorage.getItem('token'),

  isAuthenticated: () => !!localStorage.getItem('token'),
};
