import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import { LeaveBalanceCard } from '@/components/hoc/withLeaveBalance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { withDashboardData, WithDashboardDataProps } from '@/components/hoc/withDashboardData';
import {
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  PlusCircle,
  AlertCircle,
  CalendarDays,
  MapPin,
  Globe,
  Building2,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const OnshoreEmployeeDashboard: React.FC<WithDashboardDataProps> = ({ 
  dashboardData: centralizedData, 
  refreshDashboardData, 
  isRefreshing 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [upcomingHolidays, setUpcomingHolidays] = useState<Record<string, unknown>[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Fetch upcoming holidays
  const fetchUpcomingHolidays = async () => {
    try {
      setHolidaysLoading(true);
      const response = await employeeAPI.getUpcomingHolidays(5);
      if (response.success && response.data) {
        setUpcomingHolidays(response.data as unknown as Record<string, unknown>[]);
      } else {
        setUpcomingHolidays([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming holidays:', error);
      setUpcomingHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  };

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await employeeAPI.getLeaveBalance();
      if (response.success && response.data) {
        setLeaveBalance(response.data);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave balance',
        variant: 'destructive',
      });
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingHolidays();
    fetchLeaveBalance();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([
      refreshDashboardData(),
      fetchUpcomingHolidays(),
      fetchLeaveBalance(),
    ]);
    toast({
      title: 'Refreshed',
      description: 'Dashboard data has been updated',
    });
  };

  // Get real data from centralized dashboard
  const pendingRequests = centralizedData?.pendingApprovals || 0;
  const approvedRequests = centralizedData?.approvedThisMonth || 0;
  const rejectedRequests = centralizedData?.rejectedThisMonth || 0;
  const onLeaveToday = centralizedData?.onLeaveToday || 0;
  const recentRequests = centralizedData?.recentRequests || [];

  const stats = [
    {
      title: 'Pending Requests',
      value: pendingRequests.toString(),
      description: 'Awaiting approval',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Approved This Month',
      value: approvedRequests.toString(),
      description: 'Leave requests approved',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: { value: 0, isPositive: true },
    },
    {
      title: 'Rejected This Month',
      value: rejectedRequests.toString(),
      description: 'Leave requests rejected',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: { value: 0, isPositive: false },
    },
    {
      title: 'On Leave Today',
      value: onLeaveToday.toString(),
      description: 'Team members on leave',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Region Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Onshore Employee Dashboard</h1>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <MapPin className="h-3 w-3 mr-1" />
              Onshore
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Manage your leave requests and view your dashboard.
            {user?.region && (
              <span className="ml-2 text-sm">
                <Globe className="h-3 w-3 inline mr-1" />
                {user.region}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || holidaysLoading || balanceLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || holidaysLoading || balanceLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/employee/leave-management?tab=history')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={Icon}
              color={stat.color}
              bgColor={stat.bgColor}
              trend={stat.trend}
            />
          );
        })}
      </div>

      {/* Leave Balance Card */}
      <LeaveBalanceCard />

      {/* Recent Requests and Upcoming Holidays */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leave requests yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/employee/leave-management')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.slice(0, 5).map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/employee/leave-management?tab=history/${request.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {request.employeeName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.leaveType || 'Leave Request'}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.startDate && request.endDate
                            ? `${format(new Date(request.startDate), 'MMM dd')} - ${format(new Date(request.endDate), 'MMM dd, yyyy')}`
                            : 'Date not available'}
                        </p>
                        {request.days && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.days} {request.days === 1 ? 'day' : 'days'}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(request.status || 'pending')}
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/employee/leave-management?tab=history')}
                >
                  View All Requests
                  <FileText className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            {holidaysLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingHolidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming holidays</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.map((holiday: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{holiday.name || 'Holiday'}</p>
                      <p className="text-sm text-muted-foreground">
                        {holiday.date
                          ? format(new Date(holiday.date), 'EEEE, MMMM dd, yyyy')
                          : 'Date not available'}
                      </p>
                    </div>
                    <Badge variant="outline">{holiday.type || 'Public'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Region-Specific Information */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Onshore Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Employee Type</p>
              <p className="text-lg font-semibold">Onshore</p>
            </div>
            {user?.region && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Region</p>
                <p className="text-lg font-semibold">{user.region}</p>
              </div>
            )}
            {user?.timezone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Timezone</p>
                <p className="text-lg font-semibold">{user.timezone}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Department</p>
              <p className="text-lg font-semibold">{user?.department || 'Not assigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardData(OnshoreEmployeeDashboard);

