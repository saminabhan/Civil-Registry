import axios from "axios";
import { getApiBaseUrl } from "./api-config";

const apiClient = axios.create({
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  // تحديث baseURL ديناميكياً في كل طلب
  config.baseURL = getApiBaseUrl();
  
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default apiClient;
