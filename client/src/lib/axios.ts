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
  } else {
    // Log warning if no token is found
    console.warn('[API] No token found in localStorage');
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
