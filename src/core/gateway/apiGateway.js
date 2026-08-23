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

/**
 * Routes a signed-out visitor is legitimately allowed to sit on. A 401 from
 * any OTHER route means the session is gone and we must bounce to /login.
 *
 * This is deliberately an allowlist of PUBLIC paths rather than a list of
 * protected ones. The previous version listed only /dashboard and
 * /onboarding, which silently omitted /subscribe — so an expired token on
 * the paywall cleared localStorage, skipped the redirect, and left the page
 * rendering as if still signed in (with every API call 401ing behind it).
 * Any protected route added in future is covered by default now.
 */
const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/support',
  '/blog',
];

function isPublicPath(path) {
  // Exact "/" is the marketing home — public. Every other path starts with
  // "/" too, so this must be an equality check, not a prefix check.
  if (path === '/') return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

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
        // Handle 401 — the session is gone (expired, revoked, or never
        // existed). Clear it and bounce to sign-in from anywhere that isn't
        // a public page.
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');

          const path = window.location.pathname;
          if (!isPublicPath(path)) {
            // A full-page navigation, not a react-router push, is
            // deliberate: AuthContext holds `user` in React state, and
            // clearing localStorage alone leaves that stale state behind
            // (which is what let the paywall keep rendering a signed-in UI
            // after the token was wiped). A hard load rebuilds every
            // provider from scratch.
            //
            // replace() rather than href so the back button doesn't return
            // to the broken, half-authenticated screen.
            window.location.replace('/login?expired=1');
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
   * PATCH request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Axios config
   */
  patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
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
