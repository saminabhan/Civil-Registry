import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest } from "@shared/routes";
import { useLocation } from "wouter";
import { getApiBaseUrl } from "@/lib/api-config";

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const userQuery = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      
      // If no token, return null immediately
      if (!token) {
        return null;
      }
      
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      try {
        const res = await fetch(`${getApiBaseUrl()}${api.auth.me.path}`, { 
          headers,
          credentials: "include" 
        });
        
        if (res.status === 401) {
          // Token is invalid, remove it
          localStorage.removeItem("token");
          return null;
        }
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Error fetching user:', errorData);
          throw new Error(errorData.message || `Failed to fetch user: ${res.status}`);
        }
        
        return api.auth.me.responses[200].parse(await res.json());
      } catch (error: any) {
        console.error('Error in userQuery:', error);
        // If it's a network error or 500, don't remove token
        if (error.message?.includes('401') || error.message?.includes('Unauthenticated')) {
          localStorage.removeItem("token");
        }
        throw error;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      console.log("Attempting login with credentials:", { username: credentials.username });
      
      try {
        const res = await fetch(`${getApiBaseUrl()}${api.auth.login.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
        });
        
        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Non-JSON response:", text.substring(0, 200));
          
          if (res.status === 500) {
            throw new Error("خطأ في الخادم. يرجى المحاولة لاحقاً أو الاتصال بالمسؤول.");
          }
          
          throw new Error("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
        }
        
        const data = await res.json();
        console.log("Login response:", { status: res.status, data });
        
        if (!res.ok) {
          const errorMessage = data?.message || (res.status === 401 
            ? "اسم المستخدم أو كلمة المرور غير صحيحة" 
            : res.status === 500
            ? "خطأ في الخادم. يرجى المحاولة لاحقاً."
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
        
        // If it's already an Error with a message, throw it as is
        if (error instanceof Error) {
          throw error;
        }
        
        // Otherwise, create a generic error
        throw new Error(error?.message || "حدث خطأ أثناء تسجيل الدخول");
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
      
      await fetch(`${getApiBaseUrl()}${api.auth.logout.path}`, { 
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
