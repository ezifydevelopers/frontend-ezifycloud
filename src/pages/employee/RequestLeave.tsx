import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import LeaveRequestForm from '@/components/forms/LeaveRequestForm';
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

const RequestLeave: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Real data state
  const [leaveBalance, setLeaveBalance] = useState({
    annual: { remaining: 0, total: 0, used: 0 },
    sick: { remaining: 0, total: 0, used: 0 },
    casual: { remaining: 0, total: 0, used: 0 },
  });

  const [recentRequests, setRecentRequests] = useState([]);

  // Fetch real data
  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setDataLoading(true);
      
      // Add cache-busting timestamp
      const timestamp = Date.now();
      
      console.log('🔍 RequestLeave: Starting API calls...');
      console.log('🔍 RequestLeave: Timestamp:', timestamp);
      console.log('🔍 RequestLeave: Auth token exists:', !!localStorage.getItem('token'));
      console.log('🔍 RequestLeave: User data:', localStorage.getItem('user'));
      
      const balanceResponse = await employeeAPI.getLeaveBalance({ _t: timestamp } as Record<string, unknown>).catch(error => {
        console.error('❌ Failed to fetch leave balance:', error);
        return { success: false, data: null };
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const requestsResponse = await employeeAPI.getRecentRequests(10, { _t: timestamp.toString() }).catch(error => {
        console.error('❌ Failed to fetch recent requests:', error);
        return { success: false, data: [] };
      });

      console.log('🔍 RequestLeave: Balance response:', balanceResponse);
      console.log('🔍 RequestLeave: Requests response:', requestsResponse);

      if (balanceResponse.success && balanceResponse.data) {
        const balance = balanceResponse.data;
        console.log('✅ Leave Balance API Response:', balance);
        
        // Calculate real-time leave balance from approved requests
        const recentRequests = requestsResponse.success ? requestsResponse.data : [];
        const approvedRequests = recentRequests.filter(req => req.status === 'approved');
        
        const usedLeave = {
          annual: 0,
          sick: 0,
          casual: 0
        };

        approvedRequests.forEach(request => {
          const leaveType = request.leaveType || request.type;
          const days = request.days || 0;
          
          if (leaveType === 'annual' || leaveType === 'Annual Leave') {
            usedLeave.annual += days;
          } else if (leaveType === 'sick' || leaveType === 'Sick Leave') {
            usedLeave.sick += days;
          } else if (leaveType === 'casual' || leaveType === 'Casual Leave') {
            usedLeave.casual += days;
          }
        });
        
        // Handle nested structure from API with real-time calculations
        setLeaveBalance({
          annual: { 
            remaining: (balance.annual?.total || 0) - usedLeave.annual, 
            total: balance.annual?.total || 0, 
            used: usedLeave.annual
          },
          sick: { 
            remaining: (balance.sick?.total || 0) - usedLeave.sick, 
            total: balance.sick?.total || 0, 
            used: usedLeave.sick
          },
          casual: { 
            remaining: (balance.casual?.total || 0) - usedLeave.casual, 
            total: balance.casual?.total || 0, 
            used: usedLeave.casual
          },
        });
      } else {
        console.warn('❌ Leave balance API failed or returned no data');
        console.warn('❌ Balance response success:', balanceResponse.success);
        console.warn('❌ Balance response data:', balanceResponse.data);
      }

      if (requestsResponse.success && requestsResponse.data) {
        console.log('✅ Recent requests data:', requestsResponse.data);
        setRecentRequests(requestsResponse.data || []);
      } else {
        console.warn('❌ Recent requests API failed or returned no data');
        console.warn('❌ Requests response success:', requestsResponse.success);
        console.warn('❌ Requests response data:', requestsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      setLoading(true);
      
      console.log('🔍 RequestLeave: Submitting form data:', data);
      
      // Data is already transformed by the form component
      console.log('🔍 RequestLeave: Received data from form:', data);
      
      // Call the real API
      const response = await employeeAPI.createLeaveRequest(data as Record<string, unknown>);
      
      console.log('🔍 RequestLeave: API response:', response);
      
      if (response.success) {
        toast({
          title: 'Leave request submitted',
          description: 'Your leave request has been sent to your manager for approval.',
        });
        
        // Refresh data after successful submission
        await fetchEmployeeData();
        
        navigate('/employee/dashboard');
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to submit leave request. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit leave request. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'Annual Leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sick Leave':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Casual Leave':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate real statistics from leave balance
  const totalLeaveDays = leaveBalance.annual.total + leaveBalance.sick.total + leaveBalance.casual.total;
  const usedLeaveDays = leaveBalance.annual.used + leaveBalance.sick.used + leaveBalance.casual.used;
  const pendingRequests = recentRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = recentRequests.filter(req => req.status === 'approved').length;
  const totalRequests = recentRequests.length;
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

  const stats = [
    {
      title: 'Total Leave Days',
      value: totalLeaveDays,
      description: 'Available this year',
      icon: Calendar,
    },
    {
      title: 'Used This Year',
      value: usedLeaveDays,
      description: 'Days taken',
      icon: Clock,
    },
    {
      title: 'Pending Requests',
      value: pendingRequests,
      description: 'Awaiting approval',
      icon: AlertCircle,
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      description: 'Success rate',
      icon: Target,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Request Leave
                </h1>
              </div>
              <p className="text-slate-600 text-base lg:text-lg">
                Submit a new leave request. Your manager will be notified for approval.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Profile Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {dataLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg animate-pulse"
            >
              <div className="relative p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 lg:h-10 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          stats.map((stat, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 lg:space-y-2">
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.description}</p>
                  </div>
                  <div className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Content Grid - Better Organized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
        {/* Left Column - Leave Balance Summary and Recent Requests */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          {/* Leave Balance Overview */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  Leave Balance Overview
                </CardTitle>
                <p className="text-slate-600 text-sm mt-2">Track your remaining leave days across different categories</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(leaveBalance).map(([type, balance], index) => {
                  const percentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
                  const getProgressColor = (percent: number) => {
                    if (percent >= 70) return 'bg-green-500';
                    if (percent >= 40) return 'bg-yellow-500';
                    return 'bg-red-500';
                  };

                  return (
                    <div
                      key={type}
                      className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                            type === 'annual' ? 'from-blue-500 to-cyan-500' :
                            type === 'sick' ? 'from-red-500 to-pink-500' :
                            type === 'casual' ? 'from-green-500 to-emerald-500' :
                            'from-gray-500 to-slate-500'
                          }`}></div>
                          <span className="font-semibold text-slate-700 capitalize">{type} Leave</span>
                        </div>
                        <span className="text-sm font-medium text-slate-600">
                          {balance.used.toFixed(1)} / {balance.total} days
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2 mb-2"
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Used: <span className="font-medium text-slate-700">{balance.used.toFixed(1)}</span></span>
                        <span className="text-slate-500">Remaining: <span className="font-medium text-slate-700">{balance.remaining.toFixed(1)}</span></span>
                      </div>
                    </div>
                  );
            })}
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests */}
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
                <div className="space-y-3">
                  {dataLoading ? (
                    // Loading skeleton for recent requests
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 animate-pulse"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <div className="h-5 w-5 bg-gray-200 rounded"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))
                  ) : recentRequests.length > 0 ? (
                    recentRequests.map((request, index) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <CalendarDays className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-slate-800">{request.leaveType as string || request.type as string || 'Leave'}</p>
                            {request.isHalfDay && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                Half Day
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {new Date(request.startDate as string).toLocaleDateString()} - {new Date(request.endDate as string).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            Submitted: {new Date(request.createdAt as string).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">{request.days as number || 0} days</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            request.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            request.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {request.status as string}
                        </Badge>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <CalendarDays className="h-8 w-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Recent Requests</h3>
                      <p className="text-slate-500">You haven't submitted any leave requests yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Right Column - Leave Request Form */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="relative group flex-1">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl h-full flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Submit Leave Request
                </CardTitle>
                <p className="text-slate-600 text-sm mt-2">Fill out the form below to submit your leave request</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <LeaveRequestForm 
                  onSubmit={handleFormSubmit}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default RequestLeave;