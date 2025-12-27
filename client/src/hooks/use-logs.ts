import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useLogs() {
  return useQuery({
    queryKey: [api.logs.list.path],
    queryFn: async () => {
      const res = await fetch(api.logs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("فشل تحميل السجلات");
      return api.logs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateLog() {
  return useMutation({
    mutationFn: async (data: { action: string; details?: string }) => {
      await fetch(api.logs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
