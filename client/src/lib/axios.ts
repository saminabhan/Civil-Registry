import axios from "axios";

const api = axios.create({
  baseURL: "https://civil.infinet.ps/api",
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
