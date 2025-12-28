import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

export function useUsers(page: number = 1) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: async () => {
      const { data } = await api.get(`/users?page=${page}`);
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      username: string;
      name?: string;
      password: string;
      isAdmin?: boolean;
      isActive?: boolean;
    }) => {
      // Convert camelCase to snake_case for backend compatibility
      const backendPayload: any = {
        username: payload.username,
        password: payload.password,
        is_admin: payload.isAdmin ?? false,
        is_active: payload.isActive ?? true,
      };
      
      // Only include name if provided
      if (payload.name) {
        backendPayload.name = payload.name;
      }
      const { data } = await api.post("/users", backendPayload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}


export function useUser(userId: number | null) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await api.get(`/users/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const { data } = await api.patch(`/users/${id}/status`, { isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
