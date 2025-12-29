import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest } from "@shared/routes";
import { useLocation } from "wouter";
import { API_BASE_URL } from "@/lib/api-config";
  
export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const userQuery = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_BASE_URL}${api.auth.me.path}`, { 
        headers,
        credentials: "include" 
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      console.log("Attempting login with credentials:", { username: credentials.username });
      
      try {
        const res = await fetch(`${API_BASE_URL}${api.auth.login.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
        });
        
        const data = await res.json();
        console.log("Login response:", { status: res.status, data });
        
        if (!res.ok) {
          const errorMessage = data?.message || (res.status === 401 
            ? "اسم المستخدم أو كلمة المرور غير صحيحة" 
            : "حدث خطأ أثناء تسجيل الدخول");
          throw new Error(errorMessage);
        }
        
        // Backend returns { token, user }, extract and store token
        const { token, user } = data;
        if (token) {
          localStorage.setItem("token", token);
        }
        
        return api.auth.login.responses[200].parse(user);
      } catch (error: any) {
        console.error("Login mutation error:", error);
        throw error;
      }
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user);
      setLocation("/dashboard");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      await fetch(`${API_BASE_URL}${api.auth.logout.path}`, { 
        method: "POST",
        headers,
        credentials: "include" 
      });
      
      localStorage.removeItem("token");
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
