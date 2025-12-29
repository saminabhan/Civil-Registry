import axios from "axios";
import { getApiBaseUrl } from "./api-config";

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
