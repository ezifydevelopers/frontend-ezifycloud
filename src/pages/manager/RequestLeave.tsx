import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { managerAPI } from '@/lib/api';
import LeaveRequestForm from '@/components/forms/LeaveRequestForm';
import { LeaveBalanceCard } from '@/components/hoc/withLeaveBalance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, 
  Clock, 
  CheckCircle,
  FileText,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Target,
  Award,
  User,
  Building2,
  Clock3,
  CalendarDays,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { APP_CONFIG } from '@/lib/config';

const RequestLeave: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshAfterLeaveAction } = useDataRefresh();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Leave balance is now handled by the HOC

  const [recentRequests, setRecentRequests] = useState([]);

  // Fetch real data
  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      setDataLoading(true);
      
      // Add cache-busting timestamp
      const timestamp = Date.now();
      
      console.log('🔍 ManagerRequestLeave: Starting API calls...');
      console.log('🔍 ManagerRequestLeave: Timestamp:', timestamp);
      console.log('🔍 ManagerRequestLeave: Auth token exists:', !!localStorage.getItem('token'));
      console.log('🔍 ManagerRequestLeave: User data:', localStorage.getItem('user'));
      
      const balanceResponse = await managerAPI.getLeaveBalance({ _t: timestamp } as Record<string, unknown>).catch(error => {
        console.error('❌ Failed to fetch leave balance:', error);
        return { success: false, data: null };
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const requestsResponse = await managerAPI.getRecentRequests(10, { _t: timestamp.toString() }).catch(error => {
        console.error('❌ Failed to fetch recent requests:', error);
        return { success: false, data: [] };
      });

      console.log('🔍 ManagerRequestLeave: Balance response:', balanceResponse);
      console.log('🔍 ManagerRequestLeave: Requests response:', requestsResponse);

      // Leave balance is now handled by the HOC

      if (requestsResponse.success && requestsResponse.data) {
        console.log('✅ ManagerRequestLeave: Setting recent requests:', requestsResponse.data);
        setRecentRequests(requestsResponse.data as unknown[]);
      } else {
        console.warn('❌ ManagerRequestLeave: Requests API failed or returned no data');
        setRecentRequests([]);
      }
    } catch (error) {
      console.error('❌ ManagerRequestLeave: Error fetching data:', error);
      setRecentRequests([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      setLoading(true);
      
      console.log('🔍 ManagerRequestLeave: Submitting form data:', data);
      
      // Data is already transformed by the form component
      console.log('🔍 ManagerRequestLeave: Received data from form:', data);
      
      // Call the real API
      const response = await managerAPI.createLeaveRequest(data as {
        leaveType: 'annual' | 'sick' | 'casual' | 'emergency' | 'maternity' | 'paternity';
        startDate: string;
        endDate: string;
        reason: string;
        [key: string]: unknown;
      });
      
      console.log('🔍 ManagerRequestLeave: API response:', response);
      
      if (response.success) {
        toast({
          title: "✅ Leave Request Submitted",
          description: "Your leave request has been sent to admin for approval. You will receive a notification once it's reviewed.",
          duration: 6000,
        });
        
        // Use the new data refresh system
        await refreshAfterLeaveAction('create');
        
        // Refresh data after successful submission
        await fetchManagerData();
        
        navigate('/manager/dashboard');
      } else {
        // Show detailed error message if available
        const errorMessage = response.message || 'Failed to submit leave request. Please try again.';
        
        toast({
          title: "❌ Leave Request Failed",
          description: `${errorMessage}\n\nPlease check your request and try again.`,
          variant: 'destructive',
          duration: 7000,
        });
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      
      // Extract the specific error message from the backend
      let errorMessage = 'Failed to submit leave request. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a business rules validation error
        if (errorMessage.includes('Insufficient leave balance')) {
          // This is a specific business rule error - show it clearly with icon
          toast({
            title: "⚠️ Insufficient Leave Balance",
            description: `${errorMessage}\n\nPlease adjust your leave request to match your available balance.`,
            variant: 'destructive',
            duration: APP_CONFIG.UI.TOAST_DURATION.LONG,
          });
        } else if (errorMessage.includes('negative balance') || errorMessage.includes('deducted from salary')) {
          // This is a salary deduction warning - show it as a warning, not error
          toast({
            title: "💰 Salary Deduction Warning",
            description: `${errorMessage}\n\nThis leave request will result in salary deduction for excess days.`,
            variant: 'default', // Use default variant for warnings
            duration: 10000, // Show for 10 seconds
          });
        } else if (errorMessage.includes('Extended leave period') || errorMessage.includes('beyond recommended')) {
          // This is an extended leave warning - show it as a warning, not error
          toast({
            title: "⏰ Extended Leave Period",
            description: `${errorMessage}\n\nThis is an extended leave period that requires manager approval.`,
            variant: 'default', // Use default variant for warnings
            duration: 10000, // Show for 10 seconds
          });
        } else if (errorMessage.includes('Short notice period') || errorMessage.includes('insufficient notice')) {
          // This is a short notice warning - show it as a warning, not error
          toast({
            title: "📅 Short Notice Period",
            description: `${errorMessage}\n\nThis is a short notice request that requires manager approval.`,
            variant: 'default', // Use default variant for warnings
            duration: APP_CONFIG.UI.TOAST_DURATION.LONG,
          });
        } else if (errorMessage.includes('overlaps with') || errorMessage.includes('overlapping')) {
          // This is an overlapping request warning - show it as a warning, not error
          toast({
            title: "📋 Overlapping Leave Period",
            description: `${errorMessage}\n\nPlease review overlapping periods with your manager.`,
            variant: 'default', // Use default variant for warnings
            duration: APP_CONFIG.UI.TOAST_DURATION.LONG,
          });
        } else if (errorMessage.includes('Validation failed')) {
          // Handle other validation errors
          toast({
            title: "🔍 Validation Error",
            description: errorMessage,
            variant: 'destructive',
            duration: 6000,
          });
        } else {
          // Generic error
          toast({
            title: "❌ Error",
            description: errorMessage,
            variant: 'destructive',
            duration: APP_CONFIG.UI.TOAST_DURATION.MEDIUM,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeColor = (type: string) => {
    // Dynamic color assignment based on leave type
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200'
    ];
    
    // Use hash of type name to get consistent color
    let hash = 0;
    for (let i = 0; i < type.length; i++) {
      hash = ((hash << 5) - hash + type.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'rejected': return <AlertCircle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ width: '100%', maxWidth: '1088px', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading leave request data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: '1088px' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Request Leave</h1>
              <p className="text-slate-600">Submit a new leave request for admin approval</p>
            </div>
            <Button
              onClick={() => navigate('/manager/dashboard')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Leave Request Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  New Leave Request
                </CardTitle>
                <CardDescription>
                  Fill out the form below to submit your leave request. All requests require admin approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaveRequestForm
                  onSubmit={handleFormSubmit}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Leave Balance & Recent Requests */}
          <div className="space-y-6">
            {/* Leave Balance Overview - Using HOC */}
            <LeaveBalanceCard 
              customTitle="Leave Balance"
              customDescription="Your current leave balance across different categories"
            />

            {/* Recent Leave Requests */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.slice(0, 3).map((request: unknown) => {
                      const req = request as { id: string; leaveType: string; status: string; startDate: string; endDate: string; days: number };
                      return (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getLeaveTypeColor(req.leaveType)}`}>
                              {req.leaveType}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(req.status)}`}>
                              {getStatusIcon(req.status)}
                              <span className="ml-1">{req.status}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">{req.days} day{req.days !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      );
                    })}
                    {recentRequests.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/manager/leave-history')}
                        className="w-full text-slate-600 hover:text-slate-900"
                      >
                        View All Requests
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No recent requests</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg text-blue-900">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Star className="h-5 w-5 text-blue-600" />
                  </div>
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                    <Zap className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Emergency Leave</p>
                    <p className="text-xs text-blue-700">For urgent situations, emergency leave can be approved quickly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                    <Target className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Half Day Leave</p>
                    <p className="text-xs text-blue-700">You can request half-day leave for morning or afternoon.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                    <Award className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Admin Approval</p>
                    <p className="text-xs text-blue-700">All manager leave requests require admin approval.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestLeave;
