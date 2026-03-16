import axios from 'axios';

// Simple API client configuration
const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5157/api';

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

    // Handle 401 Unauthorized
    if (
      status === 401 &&
      !requestUrl.includes('/smart-erp/auth/login') &&
      !requestUrl.includes('/smart-erp/auth/verify-mfa')
    ) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_role');
      window.dispatchEvent(new Event('erp:unauthorized'));
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;