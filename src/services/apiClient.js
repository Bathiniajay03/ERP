// import axios from 'axios';

// const normalizeBaseUrl = (url) => {
//   if (!url || typeof url !== 'string') return null;
//   const trimmed = url.trim().replace(/\/+$/, '');
//   if (!trimmed) return null;
//   return trimmed.toLowerCase().endsWith('/api') ? trimmed : `${trimmed}/api`;
// };

// const resolveLocalCandidates = () => {
//   const configured = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);
//   const stored = normalizeBaseUrl(localStorage.getItem('erp_api_base_url'));
//   const defaults = [
//     'http://localhost:5157/api',
//     'http://localhost:5103/api',
//     'https://localhost:7088/api'
//   ];

//   const ordered = [configured, stored, ...defaults].filter(Boolean);
//   return [...new Set(ordered)];
// };

// const candidateBaseUrls = resolveLocalCandidates();
// let activeBaseUrl = candidateBaseUrls[0] || 'http://localhost:5157/api';

// const apiClient = axios.create({
//   baseURL: activeBaseUrl,
//   timeout: 10000,
//   headers: { 'Content-Type': 'application/json' }
// });

// apiClient.interceptors.request.use((config) => {
//   config.baseURL = activeBaseUrl;
//   config.__candidateIndex = candidateBaseUrls.findIndex((url) => url === activeBaseUrl);
//   const token = localStorage.getItem('erp_token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const status = error?.response?.status;
//     const requestUrl = String(error?.config?.url || '').toLowerCase();
//     if (
//       status === 401 &&
//       !requestUrl.includes('/smart-erp/auth/login') &&
//       !requestUrl.includes('/smart-erp/auth/verify-mfa')
//     ) {
//       localStorage.removeItem('erp_token');
//       localStorage.removeItem('erp_role');
//       window.dispatchEvent(new Event('erp:unauthorized'));
//       return Promise.reject(error);
//     }

//     const requestConfig = error?.config;
//     const isNetworkIssue = !error?.response || error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED';

//     if (!requestConfig || !isNetworkIssue) {
//       return Promise.reject(error);
//     }

//     const currentIndex =
//       typeof requestConfig.__candidateIndex === 'number'
//         ? requestConfig.__candidateIndex
//         : candidateBaseUrls.findIndex((url) => url === activeBaseUrl);
//     const nextIndex = currentIndex + 1;

//     if (nextIndex >= candidateBaseUrls.length) {
//       return Promise.reject(error);
//     }

//     activeBaseUrl = candidateBaseUrls[nextIndex];
//     localStorage.setItem('erp_api_base_url', activeBaseUrl);

//     requestConfig.__candidateIndex = nextIndex;
//     requestConfig.baseURL = activeBaseUrl;
//     return apiClient(requestConfig);
//   }
// );

// export default apiClient;


import axios from "axios";

// Read from .env (Vercel or local)
const baseURL = (process.env.REACT_APP_API_BASE_URL || "").trim();

if (!baseURL) {
  console.error("REACT_APP_API_BASE_URL is not set");
}

const apiClient = axios.create({
  baseURL,                 // e.g. https://xxxx.ngrok-free.dev/api
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true" // avoid ngrok warning page
  }
});

// Add JWT token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (logout)
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || "").toLowerCase();

    if (
      status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/api/auth/login")
    ) {
      localStorage.removeItem("erp_token");
      localStorage.removeItem("erp_role");
      window.dispatchEvent(new Event("erp:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default apiClient;