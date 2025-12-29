import axios from 'axios';

// Auto-detect API URL based on current hostname
function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const origin = window.location.origin;
    
    // Production domain - check for infinet.ps in hostname
    if (hostname === 'civil.infinet.ps' || hostname.endsWith('.infinet.ps')) {
      const apiUrl = `${origin}/api`;
      console.log('[API Config] Using production API:', apiUrl);
      return apiUrl;
    }
    
    // If we're on HTTPS, use the same origin for API
    if (protocol === 'https:') {
      const apiUrl = `${origin}/api`;
      console.log('[API Config] Using HTTPS API (same origin):', apiUrl);
      return apiUrl;
    }
    
    // Localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('[API Config] Using localhost API:', 'http://127.0.0.1:8000/api');
      return 'http://127.0.0.1:8000/api';
    }
  }
  
  // Default to localhost for development
  console.log('[API Config] Using default localhost API:', 'http://127.0.0.1:8000/api');
  return 'http://127.0.0.1:8000/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
