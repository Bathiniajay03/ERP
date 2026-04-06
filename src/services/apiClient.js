import axios from 'axios';

// Simple API client configuration
const localBaseURL = 'http://localhost:5157/api';
const envBaseURL = (process.env.REACT_APP_API_BASE_URL || '').trim();
const isBrowser = typeof window !== 'undefined';
const isLocalHost =
  isBrowser &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const shouldForceLocal =
  isLocalHost ||
  !envBaseURL ||
  envBaseURL.includes('ngrok-free.dev');
const baseURL = shouldForceLocal ? localBaseURL : envBaseURL;

console.log('Using API Base URL:', baseURL);

const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Request interceptor - add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '').toLowerCase();

    // log for debugging robot task failures
    if (requestUrl.includes('/smart-erp/robots/tasks')) {
      console.warn('Robot tasks request failed', { status, data: error?.response?.data, message: error?.message });
    }

    if (
      status === 401 &&
      !requestUrl.includes('/smart-erp/auth/login') &&
      !requestUrl.includes('/smart-erp/auth/verify-mfa')
    ) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_role');
      window.dispatchEvent(new Event('erp:unauthorized'));
      error.customMessage = 'Authentication required. Please login again.';
      return Promise.reject(error);
    }

    if (status === 500 && requestUrl.includes('/smart-erp/robots/tasks')) {
      error.customMessage = error?.response?.data?.message || 'Failed to fetch robot tasks. See server log.';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
