import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { managerAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/layout/PageHeader';
import { withDashboardData, WithDashboardDataProps } from '@/components/hoc/withDashboardData';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import TeamStatusCard from '@/components/dashboard/TeamStatusCard';
import {
  Users,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Award,
  Star,
  TrendingUp,
  Zap,
  X,
  RefreshCw,
  UserCheck,
  UserX,
  Clock3,
  Building2,
  Shield,
  Sparkles,
  LayoutDashboard,
  Calendar,
} from 'lucide-react';

const ManagerDashboard: React.FC<WithDashboardDataProps> = ({ 
  dashboardData: centralizedData, 
  refreshDashboardData, 
  isRefreshing 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingHolidays, setUpcomingHolidays] = useState<Record<string, unknown>[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    await Promise.all([
      refreshDashboardData(),
      fetchUpcomingHolidays()
    ]);
  };

  // Fetch upcoming holidays
  const fetchUpcomingHolidays = async () => {
    try {
      setHolidaysLoading(true);
      console.log('🔍 ManagerDashboard: Fetching upcoming holidays...');
      const response = await managerAPI.getUpcomingHolidays(5);
      console.log('📅 ManagerDashboard: Holidays response:', response);
      if (response.success && response.data) {
        setUpcomingHolidays(response.data as unknown as Record<string, unknown>[]);
        console.log('✅ ManagerDashboard: Holidays fetched successfully:', response.data);
      } else {
        console.log('❌ ManagerDashboard: No holidays data:', response);
        setUpcomingHolidays([]);
      }
    } catch (error) {
      console.error('❌ ManagerDashboard: Error fetching upcoming holidays:', error);
      setUpcomingHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  };

  // Team capacity data is now handled by the centralized HOC

  // Fetch holidays on component mount
  useEffect(() => {
    console.log('🔄 ManagerDashboard: Component mounted, fetching holidays...');
    fetchUpcomingHolidays();
  }, []);

  // Dashboard data is now handled by the centralized HOC

  // Refresh data when component becomes visible (user navigates to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 ManagerDashboard: Page became visible, refreshing data...');
        refreshDashboardData();
        fetchUpcomingHolidays();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshDashboardData]);

  // Use centralized dashboard data from HOC
  const pendingRequests = centralizedData.recentRequests?.filter((req: Record<string, unknown>) => 
    String(req.status || '').toLowerCase() === 'pending'
  ) || [];
  const teamSchedule = []; // Mock data for now


  // Loading state is now handled by the withDashboardData HOC

  // Error state is now handled by the withDashboardData HOC

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader
          title="Manager Dashboard"
          subtitle={`Welcome back, ${user?.name || 'Manager'}`}
          icon={LayoutDashboard}
          iconColor="from-blue-600 to-purple-600"
        >
            <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
              variant="outline"
            className="bg-white/50 border-white/20 hover:bg-white/80"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </PageHeader>
        {/* Stats Grid - Using Centralized Data */}
        <DashboardStatsCards 
          dashboardData={centralizedData}
          className="mb-8"
        />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Approvals */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Pending Approvals</CardTitle>
                      <p className="text-sm text-muted-foreground">Leave requests awaiting your review</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    {pendingRequests.length > 0 ? pendingRequests.length : (centralizedData.recentRequests?.filter((req: Record<string, unknown>) => String(req.status || '').toLowerCase() === 'pending') || []).length} pending
                  </Badge>
                </div>
              </CardHeader>
          <CardContent>
              {(centralizedData.pendingApprovals > 0 || pendingRequests.length > 0 || (centralizedData.recentRequests && centralizedData.recentRequests.some((req: Record<string, unknown>) => String(req.status || '').toLowerCase() === 'pending'))) ? (
                  <div className="space-y-4">
                    {(pendingRequests.length > 0 ? pendingRequests : centralizedData.recentRequests?.filter((req: Record<string, unknown>) => String(req.status || '').toLowerCase() === 'pending') || []).slice(0, 5).map((request: unknown, index: number) => {
                      const req = request as { id?: string; employeeName?: string; leaveType?: string; status?: string; days?: number };
                      return (
                      <div
                        key={req.id || index}
                        className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                              {req.employeeName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{req.employeeName || 'Unknown Employee'}</p>
                            <p className="text-sm text-muted-foreground">{req.leaveType || 'Leave Request'} • {req.days || 0} days</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {req.status || 'pending'}
                          </Badge>
                              <Button 
                                size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors"
                            onClick={() => navigate(`/manager/approvals/${req.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                              </Button>
                        </div>
                      </div>
                      );
                    })}
                    {pendingRequests.length > 5 && (
                      <div className="text-center pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          onClick={() => navigate('/manager/approvals')}
                        >
                          View all {pendingRequests.length} requests
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                    )}
                  </div>
              ) : (
                <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending approvals</p>
                    <p className="text-sm text-muted-foreground">All caught up! 🎉</p>
                </div>
              )}
              
          </CardContent>
        </Card>

        </div>

          {/* Right Column */}
          <div className="space-y-8">
          {/* Quick Actions */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
                    <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Quick Actions</CardTitle>
                    <p className="text-sm text-muted-foreground">Common tasks</p>
                  </div>
                </div>
            </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  onClick={() => navigate('/manager/approvals')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Review Approvals
                </Button>
                {/* Request Leave button temporarily hidden */}
                {/* <Button 
                  className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  onClick={() => navigate('/manager/leave-management')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Request Leave
                </Button> */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-slate-200 hover:bg-slate-50"
                  onClick={() => navigate('/manager/team')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team Overview
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-slate-200 hover:bg-slate-50"
                  onClick={() => navigate('/manager/settings')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Team Status - Using Centralized Data */}
            <TeamStatusCard 
              dashboardData={centralizedData}
            />

          {/* Upcoming Holidays */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Upcoming Holidays</CardTitle>
                  <p className="text-sm text-muted-foreground">Public holidays and company events</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {holidaysLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading holidays...</p>
                </div>
              ) : upcomingHolidays.length > 0 ? (
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
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming holidays</p>
                  <p className="text-sm text-muted-foreground">Check back later for updates</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
      </div>
    </div>
  );
};

// Wrap the component with the centralized dashboard data HOC
const ManagerDashboardWithData = withDashboardData(ManagerDashboard, {
  autoFetch: false, // Disable auto-refresh
  refreshInterval: 30000, // 30 seconds (not used when autoFetch is false)
  cacheTimeout: 60000 // 1 minute
});

export default ManagerDashboardWithData;