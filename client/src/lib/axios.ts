import axios from "axios";
import { getApiBaseUrl } from "./api-config";

const api = axios.create({
  // baseURL will be set dynamically in interceptor
});

api.interceptors.request.use((config) => {
  // Set baseURL dynamically for each request
  if (!config.baseURL) {
    config.baseURL = getApiBaseUrl();
  }
  
  // Add authorization token
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Debug: Log token presence (first 20 chars only for security)
    console.log('[API] Token found, adding to request:', token.substring(0, 20) + '...');
  } else {
    // Log warning if no token is found
    console.warn('[API] No token found in localStorage for request:', config.url);
  }
  
  // Ensure headers object exists
  if (!config.headers) {
    config.headers = {};
  }
  
  // Set content type if not set
  if (!config.headers['Content-Type'] && (config.method === 'post' || config.method === 'put' || config.method === 'patch')) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Return error with response data for better error handling
    return Promise.reject(error);
  }
);

export default api;
