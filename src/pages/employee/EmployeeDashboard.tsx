import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await employeeAPI.getDashboardStats();
        console.log('Employee Dashboard API Response:', response);
        setDashboardData(response.data || response);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please check if the backend server is running.');
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Leave balance data - only real data
  const leaveBalance = dashboardData?.leaveBalance || {};

  const stats = dashboardData ? [
    {
      title: 'Annual Leave',
      value: `${leaveBalance.annual?.remaining || 0} days`,
      description: `${leaveBalance.annual?.used || 0}/${leaveBalance.annual?.total || 0} used`,
      icon: Calendar,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      percentage: leaveBalance.annual?.total ? (leaveBalance.annual.used / leaveBalance.annual.total) * 100 : 0,
    },
    {
      title: 'Sick Leave',
      value: `${leaveBalance.sick?.remaining || 0} days`,
      description: `${leaveBalance.sick?.used || 0}/${leaveBalance.sick?.total || 0} used`,
      icon: Clock,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconColor: 'text-green-600',
      percentage: leaveBalance.sick?.total ? (leaveBalance.sick.used / leaveBalance.sick.total) * 100 : 0,
    },
    {
      title: 'Casual Leave',
      value: `${leaveBalance.casual?.remaining || 0} days`,
      description: `${leaveBalance.casual?.used || 0}/${leaveBalance.casual?.total || 0} used`,
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      iconColor: 'text-purple-600',
      percentage: leaveBalance.casual?.total ? (leaveBalance.casual.used / leaveBalance.casual.total) * 100 : 0,
    },
  ] : [];

  const recentRequests = dashboardData?.recentRequests || [];
  const upcomingHolidays = dashboardData?.upcomingHolidays || [];

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
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Employee Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Welcome back, <span className="font-semibold text-purple-600">{user?.name}</span>. Here's your personal overview.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            color={stat.color}
            iconColor={stat.iconColor}
            percentage={stat.percentage}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leave Balance Overview */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Leave Balance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(leaveBalance).map(([type, balance]: [string, any]) => (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{type} Leave</span>
                    <span className="text-sm text-muted-foreground">
                      {balance?.used || 0} / {balance?.total || 0} days
                    </span>
                  </div>
                  <Progress 
                    value={balance?.total ? ((balance.used / balance.total) * 100) : 0} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {balance?.used || 0}</span>
                    <span>Remaining: {balance?.remaining || 0}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate('/employee/request-leave')}
                className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
              <Button 
                onClick={() => navigate('/employee/history')}
                variant="outline" 
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                View History
              </Button>
              <Button 
                onClick={() => navigate('/employee/calendar')}
                variant="outline" 
                className="w-full justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Requests */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Recent Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length > 0 ? (
            <div className="space-y-4">
              {recentRequests.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border bg-white/50">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {request.employee?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.leaveType}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.startDate} - {request.endDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(request.status)}>
                      {request.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {request.submittedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent requests found</p>
              <Button 
                onClick={() => navigate('/employee/request-leave')}
                className="mt-4"
                variant="outline"
              >
                Request Leave
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
