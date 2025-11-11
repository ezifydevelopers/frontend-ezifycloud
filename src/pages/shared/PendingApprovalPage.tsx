import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Mail, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PendingApprovalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = () => {
    // Refresh the page to check if approval status has changed
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription className="text-base mt-2">
            Your account registration is pending administrator approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Your dashboard access is pending approval.</strong> An administrator will review your registration and approve your access soon. You will be notified once your account is approved.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-3">Account Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{user?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize">{user?.role || 'N/A'}</span>
                </div>
                {user?.department && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Department:</span>
                    <span>{user.department}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-blue-50 p-4">
              <h3 className="font-semibold mb-2 text-blue-900">What happens next?</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>An administrator will review your registration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>You will receive an email notification once approved</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>You can then log in and access your dashboard</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Approval Status
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>If you have any questions, please contact your administrator.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApprovalPage;

