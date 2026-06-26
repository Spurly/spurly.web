import axios from 'axios';

/**
 * API Gateway
 * Central point for all HTTP communication with backend
 * Handles:
 * - Base URL configuration
 * - JWT token injection
 * - Error handling
 * - Response transformation
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

class ApiGateway {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}${API_BASE}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies to be sent with requests
    });

    // Request interceptor - inject JWT token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle 401 - clear auth and bounce to the marketing home with the
        // sign-in modal open, but only from inside the dashboard. Public
        // marketing routes must never be redirected by a stray probe.
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/?auth=signin';
          }
        }

        // Handle network errors
        if (!error.response) {
          return Promise.reject({
            status: 0,
            message: 'Network error - cannot reach server',
            error,
          });
        }

        return Promise.reject(error.response?.data || error);
      }
    );
  }

  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {object} config - Axios config
   */
  get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Axios config
   */
  post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Axios config
   */
  put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {object} config - Axios config
   */
  delete(url, config = {}) {
    return this.client.delete(url, config);
  }

  /**
   * Set JWT token
   * @param {string} token - JWT token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
    }
  }

  /**
   * Remove JWT token
   */
  removeToken() {
    localStorage.removeItem('authToken');
    delete this.client.defaults.headers.Authorization;
  }

  /**
   * Get current token
   */
  getToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new ApiGateway();
