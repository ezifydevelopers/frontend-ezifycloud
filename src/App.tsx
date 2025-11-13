import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { getEmployeeDashboardPath } from "@/utils/routing";
import { offlineCache } from "@/services/offlineCache";
import { actionQueue } from "@/services/actionQueue";

// Initialize offline services on app load
(async () => {
  try {
    await offlineCache.init();
    await actionQueue.init();
    await offlineCache.cleanupExpired();
    console.log('✅ Offline services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize offline services:', error);
  }
})();

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
import OnshoreEmployeeDashboard from "@/pages/employee/OnshoreEmployeeDashboard";
import OffshoreEmployeeDashboard from "@/pages/employee/OffshoreEmployeeDashboard";

// Admin Pages
import EmployeesPage from "@/pages/admin/employees/EmployeesPage";
import LeaveManagementPage from "@/pages/admin/LeaveManagementPage";
import LeaveDashboardPage from "@/pages/admin/leave/LeaveDashboardPage";
import LeaveRequestsPage from "@/pages/admin/leave/LeaveRequestsPage";
import LeavePoliciesPage from "@/pages/admin/leave/LeavePoliciesPage";
import AdminHolidaysPage from "@/pages/admin/leave/HolidaysPage";
import PaidUnpaidLeavesPage from "@/pages/admin/leave/PaidUnpaidLeavesPage";
import HolidaysPage from "@/pages/admin/holidays/HolidaysPage";
import AttendancePage from "@/pages/admin/attendance/AttendancePage";
import SalaryManagementPage from "@/pages/admin/salary/SalaryManagementPage";
import AdminCapacityPage from "@/pages/admin/capacity/AdminCapacityPage";
import EmployeeCapacityManagementPage from "@/pages/admin/EmployeeCapacityManagementPage";
import AdminLeaveReportsPage from "@/pages/admin/reports/ReportsPage";
import AuditLogsPage from "@/pages/admin/audit-logs/AuditLogsPage";
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
import ManagerUserApprovalsPage from "@/pages/manager/UserApprovalsPage";

// Employee Pages
import RequestLeave from "@/pages/employee/RequestLeave";
import EmployeeLeaveManagementPage from "@/pages/employee/LeaveManagementPage";
import RequestLeavePage from "@/pages/employee/RequestLeavePage";
import EmployeeLeaveHistoryPage from "@/pages/employee/LeaveHistoryPage";
import EmployeeLeaveReportsPage from "@/pages/employee/LeaveReportsPage";
import EmployeeSettingsPage from "@/pages/employee/settings/EmployeeSettingsPage";
import EmployeeProfilePage from "@/pages/employee/profile/EmployeeProfilePage";

// Workspace Pages
import WorkspaceListPage from "@/pages/workspace/WorkspaceListPage";
import WorkspaceDetailPage from "@/pages/workspace/WorkspaceDetailPage";
import WorkspaceSettingsPage from "@/pages/workspace/WorkspaceSettingsPage";
import BoardListPage from "@/pages/board/BoardListPage";
import BoardDetailPage from "@/pages/board/BoardDetailPage";
import ItemDetailPage from "@/pages/board/ItemDetailPage";

// Approval Routes
import ApprovalQueuePage from "@/pages/approval/ApprovalQueuePage";
import ApprovedItemsPage from "@/pages/approval/ApprovedItemsPage";

// Shared Pages
import AccessDenied from "@/pages/shared/AccessDenied";
import PendingApprovalPage from "@/pages/shared/PendingApprovalPage";
import AccessRejectedPage from "@/pages/shared/AccessRejectedPage";
import NotFound from "./pages/NotFound";
import TemplatesMarketplacePage from "@/pages/board/TemplatesMarketplacePage";

// System Pages
import InvoiceSystemDashboard from "@/pages/invoice-system/InvoiceSystemDashboard";
import AllInvoicesPage from "@/pages/invoice-system/AllInvoicesPage";
import CreateInvoicePage from "@/pages/invoice-system/CreateInvoicePage";
import PaymentsPage from "@/pages/invoice-system/PaymentsPage";
import EstimatesPage from "@/pages/invoice-system/EstimatesPage";
import ReportsPage from "@/pages/invoice-system/ReportsPage";
import AnalyticsPage from "@/pages/invoice-system/AnalyticsPage";
import InvoiceSettingsPage from "@/pages/invoice-system/InvoiceSettingsPage";
import UserApprovalsPage from "@/pages/admin/UserApprovalsPage";

const queryClient = new QueryClient();

// RoleBasedRedirect component - must be used inside AuthProvider
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

  // If user exists, redirect based on role and employee type
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'employee':
      // Redirect to onshore or offshore dashboard based on employeeType
      return <Navigate to={getEmployeeDashboardPath(user.employeeType)} replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
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
            
            <Route path="/admin/leave-management" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <LeaveManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leave-management/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <LeaveDashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leave-management/requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <LeaveRequestsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leave-management/policies" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <LeavePoliciesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leave-management/holidays" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminHolidaysPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leave-management/paid-unpaid-leaves" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <PaidUnpaidLeavesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/leave-management/reports" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminLeaveReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/employee-capacity" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <EmployeeCapacityManagementPage />
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
            
            <Route path="/admin/user-approvals" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <UserApprovalsPage />
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
            
            <Route path="/admin/employees" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <EmployeesPage />
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
            
            <Route path="/admin/salary" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <SalaryManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AuditLogsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
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
            
            <Route path="/manager/user-approvals" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <ManagerUserApprovalsPage />
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
            
            {/* <Route path="/manager/salary" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <DashboardLayout>
                  <TeamSalaryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } /> */}
            
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
            
            <Route path="/employee/onshore-dashboard" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <OnshoreEmployeeDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/offshore-dashboard" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <OffshoreEmployeeDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Leave Management Routes - Separate Pages */}
            <Route path="/employee/request-leave" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <RequestLeavePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/leave-history" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <EmployeeLeaveHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/leave-reports" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <EmployeeLeaveReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Legacy routes - redirect to new separate pages */}
            <Route path="/employee/leave-management" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <Navigate to="/employee/request-leave" replace />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/request" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <Navigate to="/employee/request-leave" replace />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/employee/history" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <Navigate to="/employee/leave-history" replace />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            
            
            <Route path="/employee/profile" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout>
                  <EmployeeProfilePage />
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
            
            {/* Workspace Routes - Available to all authenticated users */}
            <Route path="/workspaces" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <WorkspaceListPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/workspaces/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <WorkspaceDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/workspaces/:id/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <WorkspaceSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Board Routes */}
            <Route path="/workspaces/:workspaceId/boards" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <BoardListPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/templates" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <TemplatesMarketplacePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/workspaces/:workspaceId/boards/:boardId" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <BoardDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/workspaces/:workspaceId/boards/:boardId/items/:itemId" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <ItemDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Approval Routes - Available to all authenticated users */}
            <Route path="/approvals" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <ApprovalQueuePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/workspaces/:workspaceId/approved-items" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <ApprovedItemsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Invoice System Routes */}
            <Route path="/invoice-system" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <InvoiceSystemDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <InvoiceSystemDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/workspaces" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <WorkspaceListPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/invoices" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <AllInvoicesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/invoices/create" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <CreateInvoicePage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/payments" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <PaymentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/estimates" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <EstimatesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/reports" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/analytics" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <AnalyticsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/invoice-system/settings" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                <DashboardLayout>
                  <InvoiceSettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Root redirect based on role - must be last */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Error Routes */}
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/access-rejected" element={<AccessRejectedPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </DashboardProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
