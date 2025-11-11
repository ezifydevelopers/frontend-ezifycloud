import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, Mail, LogOut, MessageCircle } from 'lucide-react';

const AccessRejectedPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Rejected</CardTitle>
          <CardDescription className="text-base mt-2">
            Your account access request has been rejected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Your dashboard access has been rejected.</strong> Please contact an administrator for more information about this decision.
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
                {user?.rejectionReason && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Rejection Reason:</span>
                        <p className="text-muted-foreground mt-1">{user.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-orange-50 p-4">
              <h3 className="font-semibold mb-2 text-orange-900">Next Steps</h3>
              <ul className="space-y-2 text-sm text-orange-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Contact your administrator to discuss the rejection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>You may need to provide additional information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>An administrator can review and potentially approve your access</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleLogout}
              variant="outline"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>If you believe this is an error, please contact your administrator immediately.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRejectedPage;

