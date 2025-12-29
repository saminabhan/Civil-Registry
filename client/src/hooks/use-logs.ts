import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import apiClient from "@/lib/axios";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { API_BASE_URL } from "@/lib/api-config";

export function useLogs(page: number = 1) {
  return useQuery({
    queryKey: [api.logs.list.path, page],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}${api.logs.list.path}?page=${page}`, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("فشل تحميل السجلات");
      const json = await res.json();
      return {
        data: json.data || [],
        currentPage: json.currentPage || 1,
        lastPage: json.lastPage || 1,
        perPage: json.perPage || 15,
        total: json.total || 0,
      };
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
      
      const res = await fetch(`${API_BASE_URL}${api.logs.create.path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create log");
      }
      
      return await res.json();
    },
  });
}

export function useUsersWithLogCounts() {
  return useQuery({
    queryKey: ['users-with-logs'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}/logs/users`, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("فشل تحميل المستخدمين");
      return await res.json();
    },
  });
}

export function useUserLogs(userId: number | null, page: number = 1) {
  return useQuery({
    queryKey: ['user-logs', userId, page],
    queryFn: async () => {
      if (!userId) return { data: [], currentPage: 1, lastPage: 1, total: 0 };
      
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}/logs/user/${userId}?page=${page}`, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("فشل تحميل سجلات المستخدم");
      const json = await res.json();
      return {
        data: json.data || [],
        currentPage: json.currentPage || 1,
        lastPage: json.lastPage || 1,
        perPage: json.perPage || 20,
        total: json.total || 0,
      };
    },
    enabled: !!userId,
  });
}

export function useUserRecentSearches(userId: number | null) {
  return useQuery({
    queryKey: ['user-recent-searches', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}/logs/user/${userId}/searches`, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("فشل تحميل عمليات البحث");
      return await res.json();
    },
    enabled: !!userId,
  });
}

export function useRecentSearches() {
  return useQuery({
    queryKey: ['recent-searches'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}/logs/recent-searches`, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("فشل تحميل آخر عمليات البحث");
      return await res.json();
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
