import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { managerAPI } from '@/lib/api';
import { LeaveBalanceCard } from '@/components/hoc/withLeaveBalance';
import LeaveRequestForm from '@/components/forms/LeaveRequestForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  PlusCircle,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Award,
  Star,
  Zap,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  BarChart3,
  User,
  Building2,
  Clock3,
  Search,
  Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDashboard } from '@/contexts/DashboardContext';
import { APP_CONFIG } from '@/lib/config';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  days: number;
  isHalfDay: boolean;
  halfDayPeriod?: string;
  isPaid?: boolean;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
}

interface TeamLeaveRequest extends LeaveRequest {
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    avatar?: string;
    employeeId?: string;
  };
  priority?: 'low' | 'medium' | 'high';
  emergencyContact?: string;
  workHandover?: string;
  totalDays?: number;
}

const ManagerLeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { triggerGlobalRefresh } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [teamLeaveRequests, setTeamLeaveRequests] = useState<TeamLeaveRequest[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [teamFilters, setTeamFilters] = useState({
    status: 'all',
    leaveType: 'all',
    department: 'all',
    search: '',
  });

  // Sync tab with URL parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab && ['overview', 'team', 'request', 'history'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'overview';
    if (activeTab !== currentTab) {
      const newSearchParams = new URLSearchParams(searchParams);
      if (activeTab === 'overview') {
        newSearchParams.delete('tab');
      } else {
        newSearchParams.set('tab', activeTab);
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [activeTab, navigate, searchParams]);

  // Fetch manager leave data
  useEffect(() => {
    fetchManagerLeaveData();
  }, []);

  // Fetch team leave requests when team tab is active
  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeamLeaveRequests();
    }
  }, [activeTab, teamFilters]);

  const fetchManagerLeaveData = async () => {
    try {
      setDataLoading(true);
      const timestamp = Date.now();
      
      console.log('🔍 ManagerLeaveManagement: Fetching leave data...');
      
      const requestsResponse = await managerAPI.getRecentRequests(10, { _t: timestamp.toString() }).catch(error => {
        console.error('❌ Failed to fetch recent requests:', error);
        return { success: false, data: [] };
      });

      if (requestsResponse.success && requestsResponse.data) {
        console.log('✅ ManagerLeaveManagement: Setting recent requests:', requestsResponse.data);
        setRecentRequests(requestsResponse.data as LeaveRequest[]);
      } else {
        console.warn('❌ ManagerLeaveManagement: Requests API failed or returned no data');
        setRecentRequests([]);
      }
    } catch (error) {
      console.error('❌ ManagerLeaveManagement: Error fetching data:', error);
      setRecentRequests([]);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchTeamLeaveRequests = async () => {
    try {
      setTeamLoading(true);
      const params: Record<string, unknown> = {
        limit: 100,
      };

      if (teamFilters.status !== 'all') {
        params.status = teamFilters.status;
      }
      if (teamFilters.leaveType !== 'all') {
        params.leaveType = teamFilters.leaveType;
      }

      const response = await managerAPI.getLeaveApprovals(params);
      
      if (response.success && response.data) {
        const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
        setTeamLeaveRequests(requests as TeamLeaveRequest[]);
      } else {
        setTeamLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching team leave requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch team leave requests',
        variant: 'destructive',
      });
      setTeamLeaveRequests([]);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await managerAPI.processApprovalAction({
        requestId,
        action: 'approve',
        comments: 'Approved by manager',
      });

      if (response.success) {
        toast({
          title: 'Request Approved',
          description: 'Leave request has been approved successfully',
        });
        await fetchTeamLeaveRequests();
        triggerGlobalRefresh('leave');
      } else {
        throw new Error(response.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaidStatus = async (requestId: string, isPaid: boolean) => {
    try {
      setLoading(true);
      const response = await managerAPI.updateLeaveRequestPaidStatus(requestId, isPaid);
      
      if (response.success) {
        toast({
          title: 'Status updated',
          description: `Leave request updated to ${isPaid ? 'paid' : 'unpaid'} successfully`,
        });
        await fetchTeamLeaveRequests();
        // Trigger global refresh for leave data so PaidUnpaidLeavesPage can refresh
        // Use a small delay to ensure backend has processed the update
        setTimeout(() => {
          triggerGlobalRefresh('leave');
        }, 100);
      } else {
        throw new Error(response.message || 'Failed to update paid status');
      }
    } catch (error) {
      console.error('Error updating paid status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update paid status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await managerAPI.processApprovalAction({
        requestId,
        action: 'reject',
        comments: 'Rejected by manager',
      });

      if (response.success) {
        toast({
          title: 'Request Rejected',
          description: 'Leave request has been rejected',
        });
        await fetchTeamLeaveRequests();
        triggerGlobalRefresh('leave');
      } else {
        throw new Error(response.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      setLoading(true);
      console.log('🔍 ManagerLeaveManagement: Submitting form data:', data);
      
      const response = await managerAPI.createLeaveRequest(data as {
        leaveType: 'annual' | 'sick' | 'casual' | 'emergency' | 'maternity' | 'paternity';
        startDate: string;
        endDate: string;
        reason: string;
        [key: string]: unknown;
      });
      
      console.log('🔍 ManagerLeaveManagement: API response:', response);
      
      if (response.success) {
        toast({
          title: "✅ Leave Request Submitted",
          description: "Your leave request has been sent to admin for approval. You will receive a notification once it's reviewed.",
          duration: APP_CONFIG.UI.TOAST_DURATION.LONG,
        });
        
        // Refresh data after successful submission
        await fetchManagerLeaveData();
        triggerGlobalRefresh('leave');
        
        // Switch to overview tab to show the updated data
        setActiveTab('overview');
      } else {
        const errorMessage = response.message || 'Failed to submit leave request';
        
        if (errorMessage.includes('Insufficient leave balance')) {
          toast({
            title: "⚠️ Insufficient Leave Balance",
            description: `${errorMessage}\n\nPlease adjust your leave request to match your available balance.`,
            variant: 'destructive',
            duration: APP_CONFIG.UI.TOAST_DURATION.LONG,
          });
        } else {
          toast({
            title: "❌ Error",
            description: errorMessage,
            variant: 'destructive',
            duration: APP_CONFIG.UI.TOAST_DURATION.MEDIUM,
          });
        }
      }
    } catch (error) {
      console.error('❌ ManagerLeaveManagement: Error submitting leave request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit leave request';
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: 'destructive',
        duration: APP_CONFIG.UI.TOAST_DURATION.MEDIUM,
      });
    } finally {
      setLoading(false);
    }
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
      case 'rejected': return <XCircle className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getLeaveTypeColor = (type: string) => {
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
    
    let hash = 0;
    for (let i = 0; i < type.length; i++) {
      hash = ((hash << 5) - hash + type.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Calculate stats from recent requests
  const totalRequests = recentRequests.length;
  const pendingRequests = recentRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = recentRequests.filter(req => req.status === 'approved').length;
  const rejectedRequests = recentRequests.filter(req => req.status === 'rejected').length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading leave management data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  onClick={() => navigate('/manager/dashboard')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Leave Management</h1>
              </div>
              <p className="text-slate-600">Manage your leave requests and track your leave balance</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">System Online</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchManagerLeaveData}
                className="text-xs hover:bg-blue-50 hover:border-blue-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="space-y-1 lg:space-y-2">
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-900">{totalRequests}</p>
                  <p className="text-xs text-slate-500">All time</p>
                </div>
                <div className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <FileText className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="space-y-1 lg:space-y-2">
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-900">{pendingRequests}</p>
                  <p className="text-xs text-slate-500">Awaiting review</p>
                </div>
                <div className="p-2 lg:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                  <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="space-y-1 lg:space-y-2">
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-900">{approvedRequests}</p>
                  <p className="text-xs text-slate-500">This year</p>
                </div>
                <div className="p-2 lg:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="space-y-1 lg:space-y-2">
                  <p className="text-sm font-medium text-slate-600">Approval Rate</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-900">{approvalRate}%</p>
                  <p className="text-xs text-slate-500">Success rate</p>
                </div>
                <div className="p-2 lg:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Target className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm border-white/30 shadow-lg rounded-2xl p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Leaves
            </TabsTrigger>
            <TabsTrigger value="request" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Request Leave
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Leave Balance - Using HOC */}
              <div className="xl:col-span-1">
                <LeaveBalanceCard 
                  customTitle="Leave Balance Overview"
                  customDescription="Track your remaining leave days across different categories"
                />
              </div>

              {/* Recent Requests */}
              <div className="xl:col-span-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                          <Clock3 className="h-5 w-5 text-white" />
                        </div>
                        Recent Leave Requests
                      </CardTitle>
                      <p className="text-slate-600 text-sm mt-2">Your latest leave request submissions</p>
                    </CardHeader>
                    <CardContent>
                      {recentRequests.length > 0 ? (
                        <div className="space-y-3">
                          {recentRequests.slice(0, 5).map((request) => (
                            <div key={request.id} className="group p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30 hover:shadow-md hover:border-blue-200/50 transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm">
                                      {user?.name?.charAt(0) || 'M'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge className={`text-xs ${getLeaveTypeColor(request.leaveType)}`}>
                                        {request.leaveType}
                                      </Badge>
                                      <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                        {getStatusIcon(request.status)}
                                        <span className="ml-1">{request.status}</span>
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {request.isHalfDay ?
                                        `Half day (${request.halfDayPeriod || 'morning'})` :
                                        `${request.days} days`
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm text-slate-500">
                                    {new Date(request.submittedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-blue-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-700 mb-2">No recent requests found</h3>
                          <p className="text-slate-500 mb-4">You haven't submitted any leave requests yet</p>
                          <Button
                            onClick={() => setActiveTab('request')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Request Leave
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Request Leave Tab */}
          <TabsContent value="request">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leave Request Form */}
              <div className="lg:col-span-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        New Leave Request
                      </CardTitle>
                      <p className="text-slate-600">
                        Fill out the form below to submit your leave request. All requests require admin approval.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <LeaveRequestForm
                        onSubmit={handleFormSubmit}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Leave Balance - Using HOC */}
              <div className="lg:col-span-1">
                <LeaveBalanceCard 
                  customTitle="Leave Balance"
                  customDescription="Your current leave balance across different categories"
                />
              </div>
            </div>
          </TabsContent>

          {/* Team Leave Requests Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        Team Leave Requests
                      </CardTitle>
                      <p className="text-slate-600 text-sm mt-2">Manage and approve leave requests from your team members</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTeamLeaveRequests}
                      disabled={teamLoading}
                      className="text-xs hover:bg-blue-50 hover:border-blue-200"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${teamLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search by employee name or reason..."
                          value={teamFilters.search}
                          onChange={(e) => setTeamFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={teamFilters.status} onValueChange={(value) => setTeamFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={teamFilters.leaveType} onValueChange={(value) => setTeamFilters(prev => ({ ...prev, leaveType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Leave Requests List */}
                  {teamLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Loading team leave requests...</p>
                    </div>
                  ) : teamLeaveRequests.length > 0 ? (
                    <div className="space-y-4">
                      {teamLeaveRequests
                        .filter(request => {
                          const matchesSearch = teamFilters.search === '' || 
                            request.employee?.name?.toLowerCase().includes(teamFilters.search.toLowerCase()) ||
                            request.reason?.toLowerCase().includes(teamFilters.search.toLowerCase());
                          const matchesStatus = teamFilters.status === 'all' || request.status === teamFilters.status;
                          const matchesType = teamFilters.leaveType === 'all' || request.leaveType === teamFilters.leaveType;
                          return matchesSearch && matchesStatus && matchesType;
                        })
                        .map((request) => (
                        <div key={request.id} className="group p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30 hover:shadow-md hover:border-blue-200/50 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm">
                                  {request.employee?.name?.charAt(0) || 'E'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-slate-900">{request.employee?.name || 'Unknown'}</h3>
                                  {request.employee?.employeeId && (
                                    <span className="text-xs font-medium text-blue-600">ID: {request.employee.employeeId}</span>
                                  )}
                                  <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700">
                                    {request.employee?.department || 'N/A'}
                                  </Badge>
                                  <Badge className={`text-xs ${getLeaveTypeColor(request.leaveType)}`}>
                                    {request.leaveType}
                                  </Badge>
                                  {request.isPaid === false && (
                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                      Unpaid
                                    </Badge>
                                  )}
                                  <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                    {getStatusIcon(request.status)}
                                    <span className="ml-1">{request.status}</span>
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">
                                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-slate-500 mb-1">
                                  {request.isHalfDay ?
                                    `Half day (${request.halfDayPeriod || 'morning'})` :
                                    `${request.days || request.totalDays} days`
                                  }
                                </p>
                                {request.reason && (
                                  <p className="text-xs text-slate-500 italic line-clamp-1">"{request.reason}"</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReject(request.id)}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </>
                              )}
                              {request.status === 'approved' && (
                                <Select
                                  value={request.isPaid === false ? 'unpaid' : 'paid'}
                                  onValueChange={(value) => handleUpdatePaidStatus(request.id, value === 'paid')}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="h-8 w-28 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {request.status !== 'pending' && (
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">
                                    {request.reviewedAt ? `Reviewed: ${new Date(request.reviewedAt).toLocaleDateString()}` : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No team leave requests found</h3>
                      <p className="text-slate-500">No leave requests from your team members at this time</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    Leave Request History
                  </CardTitle>
                  <p className="text-slate-600 text-sm mt-2">Complete history of your leave requests</p>
                </CardHeader>
                <CardContent>
                  {recentRequests.length > 0 ? (
                    <div className="space-y-3">
                      {recentRequests.map((request) => (
                        <div key={request.id} className="group p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30 hover:shadow-md hover:border-blue-200/50 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm">
                                  {user?.name?.charAt(0) || 'M'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-xs ${getLeaveTypeColor(request.leaveType)}`}>
                                    {request.leaveType}
                                  </Badge>
                                  <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                    {getStatusIcon(request.status)}
                                    <span className="ml-1">{request.status}</span>
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600">
                                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {request.isHalfDay ?
                                    `Half day (${request.halfDayPeriod || 'morning'})` :
                                    `${request.days} days`
                                  }
                                </p>
                                {request.reason && (
                                  <p className="text-xs text-slate-500 italic">"{request.reason}"</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-sm text-slate-500">
                                  Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                                </p>
                                {request.reviewedAt && (
                                  <p className="text-xs text-slate-400">
                                    Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No leave requests found</h3>
                      <p className="text-slate-500 mb-4">You haven't submitted any leave requests yet</p>
                      <Button
                        onClick={() => setActiveTab('request')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Request Leave
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagerLeaveManagement;
