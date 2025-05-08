import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import WorkOrders from "@/pages/WorkOrders";
import WorkRequests from "@/pages/WorkRequests";
import Assets from "@/pages/Assets";
import Inventory from "@/pages/Inventory";
import Resources from "@/pages/Resources";
import Scanner from "@/pages/Scanner";
import Maintenance from "@/pages/Maintenance";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        await apiRequest("GET", "/api/auth/me");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/work-orders" component={WorkOrders} />
        <Route path="/work-orders/:id" component={WorkOrders} />
        <Route path="/work-requests" component={WorkRequests} />
        <Route path="/assets" component={Assets} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/resources" component={Resources} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/maintenance" component={Maintenance} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
