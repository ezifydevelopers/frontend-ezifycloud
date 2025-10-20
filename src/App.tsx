import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

// Auth Components
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

// Layout Components
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Dashboard Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";

// Admin Pages
import EmployeesPage from "@/pages/admin/employees/EmployeesPage";
import LeaveRequestsPage from "@/pages/admin/leave-requests/LeaveRequestsPage";
import LeavePoliciesPage from "@/pages/admin/policies/LeavePoliciesPage";
import HolidaysPage from "@/pages/admin/holidays/HolidaysPage";
import AttendancePage from "@/pages/admin/attendance/AttendancePage";
import SalaryManagementPage from "@/pages/admin/salary/SalaryManagementPage";
import AdminCapacityPage from "@/pages/admin/capacity/AdminCapacityPage";
// import ReportsPage from "@/pages/admin/reports/ReportsPage";
// import AuditLogsPage from "@/pages/admin/audit-logs/AuditLogsPage";
import SettingsPage from "@/pages/admin/settings/SettingsPage";

// Manager Pages
import ApprovalsPage from "@/pages/manager/approvals/ApprovalsPage";
import TeamOverviewPage from "@/pages/manager/team/TeamOverviewPage";
import TeamMemberDetailPage from "@/pages/manager/team/TeamMemberDetailPage";
import AddTeamMemberPage from "@/pages/manager/team/AddTeamMemberPage";
import EditTeamMemberPage from "@/pages/manager/team/EditTeamMemberPage";
import TeamCapacityPage from "@/pages/manager/capacity/TeamCapacityPage";
import ManagerSettingsPage from "@/pages/manager/settings/ManagerSettingsPage";
import ManagerRequestLeave from "@/pages/manager/RequestLeave";
import ManagerLeaveManagement from "@/pages/manager/ManagerLeaveManagement";
import ManagerLeaveHistoryPage from "@/pages/manager/history/LeaveHistoryPage";
import TeamSalaryPage from "@/pages/manager/salary/TeamSalaryPage";

// Employee Pages
import RequestLeave from "@/pages/employee/RequestLeave";
import LeaveHistoryPage from "@/pages/employee/history/LeaveHistoryPage";
import EmployeeSettingsPage from "@/pages/employee/settings/EmployeeSettingsPage";

// Shared Pages
import AccessDenied from "@/pages/shared/AccessDenied";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const RoleBasedRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Only redirect to login if we're sure there's no user (after loading is complete)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists, redirect based on role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'employee':
      return <Navigate to="/employee/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DashboardProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/forgot-password" element={<ForgotPasswordForm />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/employees" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <EmployeesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leave-requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <LeaveRequestsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/policies" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <LeavePoliciesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/holidays" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <HolidaysPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/attendance" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AttendancePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/salary" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <SalaryManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/capacity" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminCapacityPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Reports and Audit Logs routes hidden */}
            {/* <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AuditLogsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } /> */}
            
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/dashboard" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ManagerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/approvals" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ApprovalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/approvals/:id" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ApprovalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/team" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <TeamOverviewPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/team/add" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <AddTeamMemberPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/team/:id/edit" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <EditTeamMemberPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/team/:id" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <TeamMemberDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            
            <Route path="/manager/capacity" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <TeamCapacityPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/settings" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ManagerSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/leave-management" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ManagerLeaveManagement />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/salary" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <TeamSalaryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/request-leave" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ManagerRequestLeave />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/manager/leave-history" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ManagerLeaveHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/dashboard" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <EmployeeDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/request" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <RequestLeave />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/request-leave" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <RequestLeave />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/history" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <LeaveHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            
            
            <Route path="/employee/settings" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <EmployeeSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Root redirect based on role - must be last */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Error Routes */}
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </DashboardProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
