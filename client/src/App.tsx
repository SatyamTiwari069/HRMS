import { Switch, Route, Redirect } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/contexts/theme-provider';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProtectedRoute } from '@/components/protected-route';
import { Loader2 } from 'lucide-react';

import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import DashboardPage from '@/pages/dashboard';
import EmployeesPage from '@/pages/employees';
import AttendancePage from '@/pages/attendance';
import LeavesPage from '@/pages/leaves';
import PayrollPage from '@/pages/payroll';
import PerformancePage from '@/pages/performance';
import RecruitmentPage from '@/pages/recruitment';
import DocumentsPage from '@/pages/documents';
import ChatbotPage from '@/pages/chatbot';
import ProfilePage from '@/pages/profile';
import NotFound from '@/pages/not-found';

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const style = {
    '--sidebar-width': '16rem',
    '--sidebar-width-icon': '3rem',
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Switch>
              <Route path="/" component={DashboardPage} />
              
              <Route path="/employees">
                <ProtectedRoute allowedRoles={['admin', 'hr', 'senior_manager']}>
                  <EmployeesPage />
                </ProtectedRoute>
              </Route>
              
              <Route path="/profile" component={ProfilePage} />
              <Route path="/attendance" component={AttendancePage} />
              <Route path="/leaves" component={LeavesPage} />
              <Route path="/payroll" component={PayrollPage} />
              <Route path="/performance" component={PerformancePage} />
              
              <Route path="/recruitment">
                <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <RecruitmentPage />
                </ProtectedRoute>
              </Route>
              
              <Route path="/documents" component={DocumentsPage} />
              <Route path="/chatbot" component={ChatbotPage} />
              
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PublicRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/">
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}

function Router() {
  const { user } = useAuth();

  return user ? <AuthenticatedApp /> : <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
