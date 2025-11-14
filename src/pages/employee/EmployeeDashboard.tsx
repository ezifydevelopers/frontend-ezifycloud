import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import { LeaveBalanceCard } from '@/components/hoc/withLeaveBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { withDashboardData, WithDashboardDataProps } from '@/components/hoc/withDashboardData';
import EmployeeDashboardStatsCards from '@/components/dashboard/EmployeeDashboardStatsCards';
import {
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  PlusCircle,
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
  Settings,
  TrendingUp,
  BookOpen,
  Flag,
  ArrowRight,
  Eye,
  MapPin,
  Globe,
  Building2,
  Plane,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';

// Interface for dashboard data structure
interface DashboardData {
  stats: {
    quickStats: {
      totalRequests: number;
      approvedRequests: number;
      rejectedRequests: number;
      pendingRequests: number;
      daysUsedThisYear: number;
      daysRemaining: number;
      averageResponseTime: number;
    };
    leaveBalance: Record<string, {
      total: number;
      used: number;
      remaining: number;
    }>;
    recentRequests: Array<{
      id: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      status: string;
      days: number;
      isHalfDay: boolean;
      submittedAt: string;
    }>;
    teamInfo: {
      teamSize: number;
      managerName: string;
      managerEmail: string;
      department: string;
    };
    personalInfo?: {
      id: string;
      name: string;
      email: string;
      department: string;
      position: string;
      managerName?: string;
      joinDate: Date | string;
      avatar?: string;
      isActive: boolean;
    };
  };
}

const EmployeeDashboard: React.FC<WithDashboardDataProps> = ({ 
  dashboardData: centralizedData, 
  refreshDashboardData, 
  isRefreshing 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Record<string, unknown>[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, unknown> | null>(null);

  // Fetch upcoming holidays
  const fetchUpcomingHolidays = async () => {
    try {
      setHolidaysLoading(true);
      console.log('🔍 EmployeeDashboard: Fetching upcoming holidays...');
      const response = await employeeAPI.getUpcomingHolidays(10);
      console.log('📅 EmployeeDashboard: Holidays response:', response);
      if (response.success && response.data) {
        const holidays = Array.isArray(response.data) ? response.data : [];
        setUpcomingHolidays(holidays as unknown as Record<string, unknown>[]);
        console.log('✅ EmployeeDashboard: Holidays fetched successfully:', holidays);
      } else {
        console.log('❌ EmployeeDashboard: No holidays data:', response);
        setUpcomingHolidays([]);
      }
    } catch (error) {
      console.error('❌ EmployeeDashboard: Error fetching upcoming holidays:', error);
      setUpcomingHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await employeeAPI.getNotifications(5);
      if (response.success && response.data) {
        const notifs = Array.isArray(response.data) ? response.data : [];
        setNotifications(notifs as unknown as Record<string, unknown>[]);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Fetch performance metrics
  const fetchPerformanceMetrics = async () => {
    try {
      const response = await employeeAPI.getPerformanceMetrics();
      if (response.success && response.data) {
        setPerformanceMetrics(response.data as unknown as Record<string, unknown>);
      } else {
        setPerformanceMetrics(null);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      setPerformanceMetrics(null);
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Employee Dashboard: Starting data fetch...');

        // Fetch comprehensive dashboard data from backend
        console.log('🔍 EmployeeDashboard: Fetching dashboard stats from backend...');
        const dashboardStatsResponse = await employeeAPI.getDashboardStats({ _t: Date.now() } as Record<string, unknown>).catch(error => {
          console.error('❌ EmployeeDashboard: Failed to fetch dashboard stats:', error);
          return { success: false, data: null };
        });
        console.log('🔍 EmployeeDashboard: Dashboard stats response:', dashboardStatsResponse);

        console.log('🔍 Employee Dashboard: Dashboard stats response:', dashboardStatsResponse);

        if (!isMounted) return;

        // Process the dashboard data from backend
        const dashboardStats = dashboardStatsResponse.success ? dashboardStatsResponse.data : null;
        console.log('🔍 Employee Dashboard: Processed dashboardStats:', dashboardStats);
        console.log('🔍 Employee Dashboard: Leave Balance from backend:', dashboardStats?.leaveBalance);

        if (dashboardStats) {
          console.log('🔍 Employee Dashboard: Processing dashboard data:', dashboardStats);

          // The backend already provides structured data, so we can use it directly
          const processedData = {
            stats: {
              quickStats: dashboardStats.quickStats || {
                totalRequests: 0,
                approvedRequests: 0,
                rejectedRequests: 0,
                pendingRequests: 0,
                daysUsedThisYear: 0,
                daysRemaining: 0,
                averageResponseTime: 0
              },
              leaveBalance: dashboardStats.leaveBalance || {},
              recentRequests: dashboardStats.recentRequests || [],
              upcomingHolidays: dashboardStats.upcomingHolidays || [],
              personalInfo: dashboardStats.personalInfo || {
                id: user?.id || '',
                name: user?.name || 'Employee',
                email: user?.email || 'employee@company.com',
                department: user?.department || 'Unassigned',
                position: 'Employee',
                managerName: 'Manager',
                joinDate: new Date(),
                isActive: true
              },
              teamInfo: dashboardStats.teamInfo || {
                teamSize: 5,
                managerName: 'Manager',
                managerEmail: 'manager@company.com',
                department: user?.department || 'Unassigned',
                teamMembers: []
              },
              performance: {
                overall: 4.2,
                attendance: 95,
                productivity: 88,
                teamwork: 92,
                communication: 85,
                lastReviewDate: new Date(),
                nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                goals: [],
                achievements: []
              },
              notifications: dashboardStats.notifications || []
            }
          };

          console.log('🔍 Employee Dashboard: Processed data:', processedData);

          if (isMounted) {
            setDashboardData(processedData);
          }
        } else {
          // Fallback data if backend is not available
          console.log('🔍 Employee Dashboard: Using fallback data');
          const fallbackData = {
            stats: {
              quickStats: {
                totalRequests: 5,
                approvedRequests: 4,
                rejectedRequests: 0,
                pendingRequests: 1,
                daysUsedThisYear: 8,
                daysRemaining: 30,
                averageResponseTime: 24
              },
              leaveBalance: {
                annual: {
                  total: 25,
                  used: 0,
                  remaining: 25
                },
                sick: {
                  total: 10,
                  used: 0,
                  remaining: 10
                },
                casual: {
                  total: 8,
                  used: 0,
                  remaining: 8
                },
                emergency: {
                  total: 5,
                  used: 0,
                  remaining: 5
                }
              },
              recentRequests: [
                {
                  id: '1',
                  leaveType: 'Annual Leave',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                  status: 'approved',
                  days: 2,
                  isHalfDay: false,
                  submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                }
              ],
              upcomingHolidays: [],
              personalInfo: {
                id: user?.id || '',
                name: user?.name || 'Employee',
                email: user?.email || 'employee@company.com',
                department: user?.department || 'Unassigned',
                position: 'Employee',
                managerName: 'Manager',
                joinDate: new Date(),
                isActive: true
              },
              teamInfo: {
                teamSize: 5,
                managerName: 'Manager',
                managerEmail: 'manager@company.com',
                department: user?.department || 'Unassigned',
                teamMembers: []
              },
              performance: {
                overall: 4.2,
                attendance: 95,
                productivity: 88,
                teamwork: 92,
                communication: 85,
                lastReviewDate: new Date(),
                nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                goals: [],
                achievements: []
              },
              notifications: []
            }
          };

          if (isMounted) {
            setDashboardData(fallbackData);
          }
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
    fetchUpcomingHolidays();
    fetchNotifications();
    fetchPerformanceMetrics();

    // Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      if (isMounted) {
        console.log('🔄 Auto-refreshing dashboard data...');
        fetchDashboardData();
        fetchUpcomingHolidays();
        fetchNotifications();
        fetchPerformanceMetrics();
      }
    }, APP_CONFIG.UI.AUTO_REFRESH.DASHBOARD);

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [user]);

  // Leave balance is now handled by the HOC
  const daysUsedThisYear = dashboardData?.stats?.quickStats?.daysUsedThisYear || 0;
  const recentRequests = dashboardData?.stats?.recentRequests || [];

  console.log('🔍 EmployeeDashboard: dashboardData:', dashboardData);
  console.log('🔍 EmployeeDashboard: dashboardData.stats:', dashboardData?.stats);

  // Use centralized dashboard data from HOC
  console.log('🔍 EmployeeDashboard: Centralized data:', centralizedData);

  // Use the separate holidays state instead of dashboard data

  const getLeaveTypeDisplayName = (dbValue: string): string => {
    if (!dbValue) return 'Leave';
    
    // Replace underscores with spaces and capitalize each word
    const formatted = dbValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Check if it's a known type and add "Leave" suffix if not already present
    const typeMap: { [key: string]: string } = {
      'annual': 'Annual Leave',
      'sick': 'Sick Leave',
      'casual': 'Casual Leave',
      'maternity': 'Maternity Leave',
      'paternity': 'Paternity Leave',
      'emergency': 'Emergency Leave'
    };
    
    const lowerValue = dbValue.toLowerCase();
    if (typeMap[lowerValue]) {
      return typeMap[lowerValue];
    }
    
    // If formatted name doesn't end with "Leave", add it
    return formatted.toLowerCase().includes('leave') ? formatted : `${formatted} Leave`;
  };

  // Calculate tenure from join date
  const calculateTenure = (joinDate: Date | string | null | undefined): string => {
    if (!joinDate) return 'N/A';
    
    const startDate = new Date(joinDate);
    const currentDate = new Date();
    
    if (isNaN(startDate.getTime())) return 'N/A';
    
    let years = currentDate.getFullYear() - startDate.getFullYear();
    let months = currentDate.getMonth() - startDate.getMonth();
    let days = currentDate.getDate() - startDate.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const parts: string[] = [];
    if (years > 0) {
      parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    }
    if (months > 0) {
      parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    }
    if (days > 0 && years === 0 && months === 0) {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Less than a day';
  };

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
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Employee Dashboard
                      </h1>
                      {user?.employeeType && (
                        <Badge 
                          className={`${
                            user.employeeType === 'onshore' 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : 'bg-purple-100 text-purple-800 border-purple-200'
                          }`}
                        >
                          {user.employeeType === 'onshore' ? (
                            <MapPin className="h-3 w-3 mr-1" />
                          ) : (
                            <Plane className="h-3 w-3 mr-1" />
                          )}
                          {user.employeeType === 'onshore' ? 'Onshore' : 'Offshore'}
                        </Badge>
                      )}
                    </div>
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
                    {user?.region && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Globe className="h-4 w-4" />
                        <span>{user.region}</span>
                      </div>
                    )}
                    {user?.timezone && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        <span>{user.timezone}</span>
                      </div>
                    )}
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

          {/* Stats Overview Section - Using Centralized Data */}
          <EmployeeDashboardStatsCards 
            dashboardData={centralizedData}
            className="mb-8"
          />

          {/* Main Content Grid - Better Organized */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Leave Balance & Recent Requests */}
            <div className="xl:col-span-2 space-y-6">
              {/* Leave Balance Overview - Using HOC */}
              <LeaveBalanceCard 
                customTitle="Leave Balance Overview"
                customDescription="Track your remaining leave days across different categories"
              />

              {/* Recent Requests */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          Recent Leave Requests
                        </CardTitle>
                        <p className="text-slate-600 text-sm mt-2">Your latest leave request submissions</p>
                      </div>
                      {recentRequests.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/employee/leave-history')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          View All
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentRequests.length > 0 ? (
                      <div className="space-y-3">
                        {recentRequests.map((request: Record<string, unknown>) => (
                          <div 
                            key={request.id as string || Math.random().toString()} 
                            className="group p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30 hover:shadow-md hover:border-blue-200/50 transition-all duration-200 cursor-pointer"
                            onClick={() => navigate(`/employee/leave-management?tab=history`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm">
                                    {user?.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-800">
                                      {getLeaveTypeDisplayName(request.leaveType as string || request.type as string || '')}
                                    </p>
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
                                  className={`px-3 py-1 text-xs font-medium ${request.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
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
                          onClick={() => navigate('/employee/leave-management')}
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
                      <FileText className="h-5 w-5 mr-3" />
                      Request Leave
                    </Button>
                    <Button
                      onClick={() => navigate('/employee/leave-history')}
                      variant="outline"
                      className="w-full justify-start h-12 text-base font-medium border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                    >
                      <Clock className="h-5 w-5 mr-3" />
                      Leave History
                    </Button>
                    <Button
                      onClick={() => navigate('/employee/leave-reports')}
                      variant="outline"
                      className="w-full justify-start h-12 text-base font-medium border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                    >
                      <BarChart3 className="h-5 w-5 mr-3" />
                      Leave Reports
                    </Button>
                    <Button
                      onClick={() => navigate('/employee/settings')}
                      variant="outline"
                      className="w-full justify-start h-12 text-base font-medium border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
              {/* Employee Information */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <Card className={`relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl ${
                  user?.employeeType === 'onshore' 
                    ? 'bg-gradient-to-br from-blue-50/50 to-purple-50/50 border-blue-200/50' 
                    : user?.employeeType === 'offshore'
                    ? 'bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-200/50'
                    : ''
                }`}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className={`p-2 rounded-xl ${
                        user?.employeeType === 'onshore'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                          : user?.employeeType === 'offshore'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}>
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      Employee Information
                    </CardTitle>
                    <p className="text-slate-600 text-sm mt-2">Your employee details and team information</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {user?.employeeType && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Employee Type</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold capitalize">{user.employeeType}</p>
                            <Badge 
                              className={`${
                                user.employeeType === 'onshore' 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                  : 'bg-purple-100 text-purple-800 border-purple-200'
                              }`}
                            >
                              {user.employeeType === 'onshore' ? (
                                <MapPin className="h-3 w-3 mr-1" />
                              ) : (
                                <Plane className="h-3 w-3 mr-1" />
                              )}
                              {user.employeeType === 'onshore' ? 'Onshore' : 'Offshore'}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {user?.region && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Region</p>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-slate-500" />
                            <p className="text-lg font-semibold">{user.region}</p>
                          </div>
                        </div>
                      )}
                      {user?.timezone && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Timezone</p>
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-slate-500" />
                            <p className="text-lg font-semibold">{user.timezone}</p>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Department</p>
                        <p className="text-lg font-semibold">{user?.department || dashboardData?.stats?.teamInfo?.department || 'Not assigned'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Tenure</p>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-500" />
                          <p className="text-lg font-semibold">
                            {calculateTenure(
                              dashboardData?.stats?.personalInfo?.joinDate || 
                              user?.joinDate || 
                              null
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    {user?.employeeType === 'offshore' && (
                      <div className="mt-4 p-4 bg-white/50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Offshore-Specific Notes</p>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Different holiday calendar may apply</li>
                          <li>• Timezone considerations for leave requests</li>
                          <li>• Regional compliance requirements</li>
                        </ul>
                      </div>
                    )}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                          <span className="font-semibold text-slate-700">Manager</span>
                        </div>
                        <span className="text-sm text-slate-500">
                          {dashboardData?.stats?.teamInfo?.teamSize || 5} members
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-800">
                          {dashboardData?.stats?.teamInfo?.managerName || 'Manager Name'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {dashboardData?.stats?.teamInfo?.managerEmail || 'manager@company.com'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-white" />
                      </div>
                      Notifications
                    </CardTitle>
                    <p className="text-slate-600 text-sm mt-2">Recent updates and alerts</p>
                  </CardHeader>
                  <CardContent>
                    {notificationsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading notifications...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {notifications.map((notification: Record<string, unknown>) => (
                          <div 
                            key={notification.id as string || Math.random().toString()} 
                            className="p-3 rounded-lg border border-slate-200/50 bg-gradient-to-r from-slate-50 to-purple-50/30 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="p-1.5 bg-purple-100 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-sm">{notification.title as string || 'Notification'}</p>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {notification.message as string || notification.description as string || ''}
                                </p>
                                {notification.createdAt && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(notification.createdAt as string).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No notifications</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              {performanceMetrics && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                  <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        Performance
                      </CardTitle>
                      <p className="text-slate-600 text-sm mt-2">Your performance metrics</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {performanceMetrics.overall && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">Overall Score</span>
                              <span className="text-sm font-bold text-amber-600">
                                {typeof performanceMetrics.overall === 'number' 
                                  ? performanceMetrics.overall.toFixed(1) 
                                  : String(performanceMetrics.overall || '')}
                              </span>
                            </div>
                            <Progress 
                              value={typeof performanceMetrics.overall === 'number' ? performanceMetrics.overall * 20 : 0} 
                              className="h-2"
                            />
                          </div>
                        )}
                        {performanceMetrics.attendance && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">Attendance</span>
                              <span className="text-sm font-semibold text-slate-600">
                                {typeof performanceMetrics.attendance === 'number' 
                                  ? `${performanceMetrics.attendance}%` 
                                  : String(performanceMetrics.attendance || '')}
                              </span>
                            </div>
                            <Progress 
                              value={typeof performanceMetrics.attendance === 'number' ? performanceMetrics.attendance : 0} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Upcoming Holidays */}
              {holidaysLoading ? (
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
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading holidays...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : upcomingHolidays.length > 0 ? (
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
                                  {holiday.date ? new Date(holiday.date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {holiday.date ? new Date(holiday.date as string).toLocaleDateString('en-US', { weekday: 'short' }) : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
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
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">No upcoming holidays</p>
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

// Wrap the component with the centralized dashboard data HOC
const EmployeeDashboardWithData = withDashboardData(EmployeeDashboard, {
  autoFetch: true,
  refreshInterval: 30000, // 30 seconds
  cacheTimeout: 60000 // 1 minute
});

export default EmployeeDashboardWithData;
