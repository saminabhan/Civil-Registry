import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import apiClient from "@/lib/axios";
import { useEffect } from "react";
import { useLocation } from "wouter";

const API_BASE_URL = "http://127.0.0.1:8000";

export function useLogs() {
  return useQuery({
    queryKey: [api.logs.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}${api.logs.list.path}`, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("فشل تحميل السجلات");
      return api.logs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLog() {
  return useMutation({
    mutationFn: async (data: { action: string; details?: string }) => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      await fetch(`${API_BASE_URL}${api.logs.create.path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });
    },
  });
}

// Hook to automatically track navigation
export function usePageTracking() {
  const [location] = useLocation();
  const { mutate: log } = useCreateLog();

  useEffect(() => {
    log({ action: 'NAVIGATE', details: location });
  }, [location, log]);
}
