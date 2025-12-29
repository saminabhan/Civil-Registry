import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import apiClient from "@/lib/axios";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // 🔹 Current user
  const userQuery = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await apiClient.get(api.auth.me.path);
      return api.auth.me.responses[200].parse(res.data);
    },
    retry: false,
  });

  // 🔹 Login
  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiClient.post(api.auth.login.path, credentials);
      return api.auth.login.responses[200].parse(res.data.user);
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      setLocation("/dashboard");
    },
  });

  // 🔹 Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(api.auth.logout.path);
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      setLocation("/");
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
  };
}
