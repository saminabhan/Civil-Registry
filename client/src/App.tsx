import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { usePageTracking } from "@/hooks/use-logs";
import { Loader2 } from "lucide-react";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
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
    <div className="flex min-h-screen bg-gray-50/50" dir="rtl">
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

  return (
    <Switch>
      <Route path="/" component={Login} />
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
