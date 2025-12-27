import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCitizen } from "@shared/routes";

export function useSearchCitizens(params?: Record<string, any>) {
  // Only search if at least one param has a value
  const isEnabled = params && Object.values(params).some(val => val && String(val).trim().length > 0);
  
  // Construct URL with query params
  const url = isEnabled 
    ? `${api.citizens.search.path}?${new URLSearchParams(params).toString()}`
    : null;

  return useQuery({
    queryKey: [api.citizens.search.path, params],
    queryFn: async () => {
      if (!url) return [];
      const res = await fetch(url, { credentials: "include" });
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
      const res = await fetch(api.citizens.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
