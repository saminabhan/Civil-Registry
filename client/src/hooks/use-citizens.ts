import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCitizen } from "@shared/routes";

const API_BASE_URL = "http://127.0.0.1:8000";

export function useSearchCitizens(params?: Record<string, any>) {
  // Only search if at least one param has a value
  const isEnabled = params && Object.values(params).some(val => val && String(val).trim().length > 0);
  
  // Construct URL with query params
  const url = isEnabled 
    ? `${API_BASE_URL}${api.citizens.search.path}?${new URLSearchParams(params).toString()}`
    : null;

  return useQuery({
    queryKey: [api.citizens.search.path, params],
    queryFn: async () => {
      if (!url) return [];
      
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(url, { 
        headers,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("فشل البحث");
      return api.citizens.search.responses[200].parse(await res.json());
    },
    enabled: !!url,
  });
}

export function useCreateCitizen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCitizen) => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}${api.citizens.create.path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("فشل إنشاء السجل");
      return api.citizens.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate search queries potentially
      queryClient.invalidateQueries({ queryKey: [api.citizens.search.path] });
    }
  });
}
