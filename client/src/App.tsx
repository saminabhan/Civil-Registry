import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { usePageTracking } from "@/hooks/use-logs";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { updateLastActivity, isSessionExpired, clearSession } from "@/lib/session";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import Logs from "@/pages/Logs";
import AllLogs from "@/pages/AllLogs";
import UserLogs from "@/pages/UserLogs";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/Sidebar";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-slate-900/50" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <Component />
        </div>
      </main>
    </div>
  );
}

function Router() {
  // Global page tracking for logs
  usePageTracking();
  
  // Session management: track user activity and check for expiration
  useEffect(() => {
    // Events that indicate user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      // Only update if user is logged in
      if (localStorage.getItem("token")) {
        updateLastActivity();
      }
    };
    
    // Check session expiration periodically (every minute)
    const checkSessionInterval = setInterval(() => {
      if (localStorage.getItem("token") && isSessionExpired()) {
        clearSession();
        // Redirect to login if not already there
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }, 60000); // Check every minute
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Initial activity update
    handleActivity();
    
    return () => {
      // Cleanup: remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(checkSessionInterval);
    };
  }, []);

  return (
    <Switch>
      <Route path="/" component={Login} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      
      <Route path="/users">
        <ProtectedRoute component={Users} adminOnly />
      </Route>
      
      <Route path="/logs">
        <ProtectedRoute component={Logs} adminOnly />
      </Route>
      
      <Route path="/logs/all">
        <ProtectedRoute component={AllLogs} adminOnly />
      </Route>
      
      <Route path="/logs/user/:userId">
        <ProtectedRoute component={UserLogs} adminOnly />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <ThemeToggle />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
