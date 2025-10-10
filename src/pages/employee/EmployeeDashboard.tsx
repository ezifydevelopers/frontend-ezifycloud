import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  PlusCircle,
  TrendingUp,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Award,
  Star,
  Zap,
  BarChart3,
  AlertCircle,
  CalendarDays,
  Clock3,
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    let isMounted = true; 
    
    const fetchDashboardData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Employee Dashboard: Starting data fetch...');

        console.log('🔍 Employee Dashboard: Fetching dashboard stats...');
        const dashboardStatsResponse = await employeeAPI.getDashboardStats({ _t: Date.now() } as Record<string, unknown>).catch(error => {
          console.warn('Failed to fetch dashboard stats:', error);
          return { success: false, data: null };
        });
        
        // Wait 200ms between calls
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (!isMounted) return; // Check after async operation
        
        console.log('🔍 Employee Dashboard: Fetching leave balance...');
        const leaveBalanceResponse = await employeeAPI.getLeaveBalance({ _t: Date.now() } as Record<string, unknown>).catch(error => {
          console.warn('Failed to fetch leave balance:', error);
          return { success: false, data: null };
        });
        
        console.log('🔍 Employee Dashboard: Leave balance response:', leaveBalanceResponse);
        
        if (!isMounted) return; // Check after async operation
        
        // Wait 200ms between calls
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('🔍 Employee Dashboard: Fetching recent requests...');
        const recentRequestsResponse = await employeeAPI.getRecentRequests(10).catch(error => {
          console.warn('Failed to fetch recent requests:', error);
          return { success: false, data: [] };
        });
        
        if (!isMounted) return; // Check after async operation
        
        // Wait 200ms between calls
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('🔍 Employee Dashboard: Fetching upcoming holidays...');
        const upcomingHolidaysResponse = await employeeAPI.getUpcomingHolidays(5).catch(error => {
          console.warn('Failed to fetch upcoming holidays:', error);
          return { success: false, data: [] };
        });
        
        if (!isMounted) return; // Check after async operation

        console.log('🔍 Employee Dashboard API Responses:', {
          dashboardStats: dashboardStatsResponse,
          leaveBalance: leaveBalanceResponse,
          recentRequests: recentRequestsResponse,
          upcomingHolidays: upcomingHolidaysResponse
        });

        // Process and combine the data
        const dashboardStats = dashboardStatsResponse.success ? dashboardStatsResponse.data : null;
        const leaveBalance = leaveBalanceResponse.success ? leaveBalanceResponse.data : null;
        const recentRequests = recentRequestsResponse.success ? recentRequestsResponse.data : [];
        const upcomingHolidays = upcomingHolidaysResponse.success ? upcomingHolidaysResponse.data : [];

        // Calculate real-time leave balance from approved requests
        const calculateRealTimeLeaveBalance = (baseBalance: unknown, requests: unknown[]) => {
          if (!baseBalance || !requests) return baseBalance;
          
          const approvedRequests = requests.filter((req: Record<string, unknown>) => req.status === 'approved');
          const usedLeave = {
            annual: 0,
            sick: 0,
            casual: 0,
            emergency: 0
          };

          approvedRequests.forEach((request: Record<string, unknown>) => {
            const leaveType = request.leaveType || request.type;
            const isHalfDay = request.isHalfDay as boolean || false;
            const days = isHalfDay ? 0.5 : (Number(request.days) || 0);
            
            if (leaveType === 'annual' || leaveType === 'Annual Leave') {
              usedLeave.annual += days;
            } else if (leaveType === 'sick' || leaveType === 'Sick Leave') {
              usedLeave.sick += days;
            } else if (leaveType === 'casual' || leaveType === 'Casual Leave') {
              usedLeave.casual += days;
            } else if (leaveType === 'emergency' || leaveType === 'Emergency Leave') {
              usedLeave.emergency += days;
            }
          });

          // Update leave balance with real-time data
          const balance = baseBalance as Record<string, unknown>;
          return {
            annual: {
              total: (balance.annual as Record<string, unknown>)?.total as number || 20,
              used: usedLeave.annual,
              remaining: ((balance.annual as Record<string, unknown>)?.total as number || 20) - usedLeave.annual
            },
            sick: {
              total: (balance.sick as Record<string, unknown>)?.total as number || 10,
              used: usedLeave.sick,
              remaining: ((balance.sick as Record<string, unknown>)?.total as number || 10) - usedLeave.sick
            },
            casual: {
              total: (balance.casual as Record<string, unknown>)?.total as number || 5,
              used: usedLeave.casual,
              remaining: ((balance.casual as Record<string, unknown>)?.total as number || 5) - usedLeave.casual
            },
            emergency: {
              total: (balance.emergency as Record<string, unknown>)?.total as number || 3,
              used: usedLeave.emergency,
              remaining: ((balance.emergency as Record<string, unknown>)?.total as number || 3) - usedLeave.emergency
            }
          };
        };

        // Create comprehensive dashboard data with real-time leave balance
        const realTimeLeaveBalance = calculateRealTimeLeaveBalance(dashboardStats?.leaveBalance, recentRequests);
        
        const combinedData = {
          ...dashboardStats,
          leaveBalance: realTimeLeaveBalance,
          recentRequests: recentRequests,
          upcomingHolidays: upcomingHolidays,
          pendingRequests: dashboardStats?.pendingRequests || 0,
          approvedRequests: dashboardStats?.approvedRequests || 0,
          rejectedRequests: dashboardStats?.rejectedRequests || 0,
          totalLeaveDays: dashboardStats?.totalLeaveDays || 0,
          teamSize: dashboardStats?.teamSize || 0,
          performanceScore: dashboardStats?.performanceScore || 0
        };

        console.log('🔍 Employee Dashboard: Combined data:', combinedData);
        
        if (isMounted) {
          setDashboardData(combinedData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) {
          setError('Failed to load dashboard data. Please check if the backend server is running.');
          setDashboardData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes (300000ms) instead of 30 seconds
    // This reduces unnecessary API calls while still keeping data relatively fresh
    const refreshInterval = setInterval(() => {
      if (isMounted) {
        console.log('🔄 Auto-refreshing dashboard data...');
        fetchDashboardData();
      }
    }, 300000); // 5 minutes instead of 30 seconds

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  // Leave balance data - map from API response structure
  const rawLeaveBalance = dashboardData?.stats?.leaveBalance || {};
  console.log('🔍 EmployeeDashboard: dashboardData:', dashboardData);
  console.log('🔍 EmployeeDashboard: dashboardData.stats:', dashboardData?.stats);
  console.log('🔍 EmployeeDashboard: Raw Leave Balance:', rawLeaveBalance);
  
  const balance = rawLeaveBalance as Record<string, unknown>;
  const leaveBalance = {
    annual: {
      total: (balance.annual as Record<string, unknown>)?.total as number || 20,
      used: (balance.annual as Record<string, unknown>)?.used as number || 5,
      remaining: (balance.annual as Record<string, unknown>)?.remaining as number || 15
    },
    sick: {
      total: (balance.sick as Record<string, unknown>)?.total as number || 10,
      used: (balance.sick as Record<string, unknown>)?.used as number || 2,
      remaining: (balance.sick as Record<string, unknown>)?.remaining as number || 8
    },
    casual: {
      total: (balance.casual as Record<string, unknown>)?.total as number || 5,
      used: (balance.casual as Record<string, unknown>)?.used as number || 1,
      remaining: (balance.casual as Record<string, unknown>)?.remaining as number || 4
    },
    emergency: {
      total: (balance.emergency as Record<string, unknown>)?.total as number || 3,
      used: (balance.emergency as Record<string, unknown>)?.used as number || 0,
      remaining: (balance.emergency as Record<string, unknown>)?.remaining as number || 3
    }
  };

  // Extract data from dashboard context - employee dashboard has a different structure
  const stats = dashboardData?.stats ? [
    {
      title: 'Pending Requests',
      value: dashboardData.stats.quickStats?.pendingRequests || 0,
      description: 'Awaiting approval',
      icon: Clock,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconColor: 'text-amber-600',
      percentage: 0,
    },
    {
      title: 'Approved Requests',
      value: dashboardData.stats.quickStats?.approvedRequests || 0,
      description: 'This year',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconColor: 'text-green-600',
      percentage: 0,
    },
    {
      title: 'Total Leave Days',
      value: dashboardData.stats.leaveBalance?.total?.totalDays || 0,
      description: 'Available this year',
      icon: Calendar,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      percentage: 0,
    },
  ] : [
    // Fallback data if no dashboard data
    {
      title: 'Pending Requests',
      value: 1,
      description: 'Awaiting approval',
      icon: Clock,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconColor: 'text-amber-600',
      percentage: 0,
    },
    {
      title: 'Approved Requests',
      value: 4,
      description: 'This year',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconColor: 'text-green-600',
      percentage: 0,
    },
    {
      title: 'Total Leave Days',
      value: 38,
      description: 'Available this year',
      icon: Calendar,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      percentage: 0,
    },
  ];

  const recentRequests = dashboardData?.stats?.recentRequests || [];
  const upcomingHolidays = dashboardData?.stats?.upcomingHolidays || [];

  console.log('🔍 EmployeeDashboard: dashboardData:', dashboardData);
  console.log('🔍 EmployeeDashboard: stats:', stats);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                  <User className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Employee Dashboard
                </h1>
              </div>
              <p className="text-slate-600 text-base lg:text-lg">
                Welcome back, <span className="font-semibold text-blue-600">{user?.name}</span>. Here's your personal overview.
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
                <span className="text-sm text-green-700 font-medium">System Online</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  window.location.reload();
                }}
                className="text-xs hover:bg-blue-50 hover:border-blue-200"
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
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
        ))}
      </div>

      {/* Main Content Grid - Better Organized */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Leave Balance & Recent Requests */}
        <div className="xl:col-span-2 space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Leave Balance Overview
                </CardTitle>
                <p className="text-slate-600 text-sm mt-2">Track your remaining leave days across different categories</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(leaveBalance).map(([type, balance]: [string, unknown]) => {
                const used = (balance as Record<string, unknown>)?.used as number || 0;
                const total = (balance as Record<string, unknown>)?.total as number || 0;
                const remaining = (balance as Record<string, unknown>)?.remaining as number || 0;
                const percentage = total ? (used / total) * 100 : 0;
                
                const getTypeColor = (type: string) => {
                  switch (type.toLowerCase()) {
                    case 'annual': return 'from-blue-500 to-cyan-500';
                    case 'sick': return 'from-red-500 to-pink-500';
                    case 'casual': return 'from-green-500 to-emerald-500';
                    case 'emergency': return 'from-orange-500 to-yellow-500';
                    default: return 'from-gray-500 to-slate-500';
                  }
                };

                return (
                  <div key={type} className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getTypeColor(type)}`}></div>
                        <span className="font-semibold text-slate-700 capitalize">{type} Leave</span>
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {used.toFixed(1)} / {total} days
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2 mb-2"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Used: <span className="font-medium text-slate-700">{used.toFixed(1)}</span></span>
                      <span className="text-slate-500">Remaining: <span className="font-medium text-slate-700">{remaining.toFixed(1)}</span></span>
                    </div>
                  </div>
                );
                  })}
                </div>
              
                {/* Total Leave Summary */}
                <div className="pt-4 border-t border-slate-200">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <span className="font-semibold text-slate-700">Total Leave Summary</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-600">
                      {Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.used as number || 0), 0).toFixed(1)} / {Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.total as number || 0), 0)} days
                    </span>
                    <span className="text-xs text-slate-500">
                      {Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.total as number || 0), 0) ? 
                        Math.round((Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.used as number || 0), 0) / Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.total as number || 0), 0)) * 100) : 0}% used
                    </span>
                  </div>
                  <Progress 
                    value={Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.total as number || 0), 0) ? 
                      (Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.used as number || 0), 0) / Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.total as number || 0), 0)) * 100 : 0} 
                    className="h-2 mb-3"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Used: <span className="font-medium text-slate-700">{Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.used as number || 0), 0).toFixed(1)}</span></span>
                    <span className="text-slate-500">Remaining: <span className="font-medium text-slate-700">{Object.values(leaveBalance).reduce((sum: number, balance: unknown) => sum + ((balance as Record<string, unknown>)?.remaining as number || 0), 0).toFixed(1)}</span></span>
                  </div>
                </div>
              </div>
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
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Recent Leave Requests
                </CardTitle>
                <p className="text-slate-600 text-sm mt-2">Your latest leave request submissions</p>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.map((request: Record<string, unknown>) => (
                      <div key={request.id as string || Math.random().toString()} className="group p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30 hover:shadow-md hover:border-blue-200/50 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm">
                                {user?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
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
                                {request.isHalfDay ? 
                                  `Half day (${request.halfDayPeriod as string || 'morning'})` : 
                                  `${request.days as number || 0} days`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge 
                              variant={getStatusVariant(request.status as string)}
                              className={`px-3 py-1 text-xs font-medium ${
                                request.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {request.status as string}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {new Date(request.submittedAt as string).toLocaleDateString()}
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
                      onClick={() => navigate('/employee/request-leave')}
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

        {/* Right Column - Quick Actions & Upcoming Holidays */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
                <p className="text-slate-600 text-sm mt-2">Common tasks and shortcuts</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/employee/request-leave')}
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <PlusCircle className="h-5 w-5 mr-3" />
                  Request Leave
                </Button>
                <Button 
                  onClick={() => navigate('/employee/history')}
                  variant="outline" 
                  className="w-full justify-start h-12 text-base font-medium border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  View History
                </Button>
                <Button 
                  onClick={() => navigate('/employee/calendar')}
                  variant="outline" 
                  className="w-full justify-start h-12 text-base font-medium border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  View Calendar
                </Button>
              </CardContent>
            </Card>
          </div>
          {/* Upcoming Holidays */}
          {upcomingHolidays.length > 0 && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    Upcoming Holidays
                  </CardTitle>
                  <p className="text-slate-600 text-sm mt-2">Public holidays and company events</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingHolidays.map((holiday: Record<string, unknown>) => (
                      <div key={holiday.id as string || Math.random().toString()} className="group p-3 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-slate-50 to-emerald-50/30 hover:shadow-md hover:border-emerald-200/50 transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-800 text-sm">{holiday.name as string || 'Holiday'}</p>
                              <p className="text-xs text-slate-600">
                                {holiday.type as string || 'Holiday'} Holiday
                              </p>
                              {holiday.description && (
                                <p className="text-xs text-slate-500">
                                  {holiday.description as string}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-800 text-sm">
                              {new Date(holiday.date as string).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(holiday.date as string).toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
