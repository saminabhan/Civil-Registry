import axios from "axios";
import { getApiBaseUrl } from "./api-config";

const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // تحديث baseURL ديناميكياً في كل طلب
  config.baseURL = getApiBaseUrl();
  
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
