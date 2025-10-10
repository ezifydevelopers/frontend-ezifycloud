import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PageHeader from '@/components/layout/PageHeader';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Target,
  Award,
  Star,
  BarChart3,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';

interface LeaveRequest {
  id: string;
  employee?: {
    name?: string;
    department?: string;
  };
  leaveType?: string;
  startDate?: string;
  status?: string;
  submittedAt?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, loading, error, refreshDashboard } = useDashboard();
  const navigate = useNavigate();

  const handleRefresh = () => {
    refreshDashboard();
  };

  // Stats configuration - with fallback data
  const stats = dashboardData?.stats ? [
    {
      title: 'Total Employees',
      value: dashboardData.stats.totalEmployees || 10,
      description: 'Active employees',
      icon: Users,
      trend: { value: 8.3, isPositive: true },
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pending Requests',
      value: dashboardData.stats.pendingLeaveRequests || 5,
      description: 'Require attention',
      icon: Clock,
      variant: 'pending' as const,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Approved This Month',
      value: dashboardData.stats.approvedLeaveRequests || 12,
      description: 'Leave requests',
      icon: CheckCircle,
      variant: 'success' as const,
      trend: { value: 12.5, isPositive: true },
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconColor: 'text-green-600',
    },
    {
      title: 'Rejected This Month',
      value: dashboardData.stats.rejectedLeaveRequests || 2,
      description: 'Leave requests',
      icon: XCircle,
      variant: 'destructive' as const,
      color: 'bg-gradient-to-br from-red-500 to-rose-600',
      iconColor: 'text-red-600',
    },
  ] : [
    // Fallback data if no dashboard data
    {
      title: 'Total Employees',
      value: 10,
      description: 'Active employees',
      icon: Users,
      trend: { value: 8.3, isPositive: true },
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pending Requests',
      value: 5,
      description: 'Require attention',
      icon: Clock,
      variant: 'pending' as const,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Approved This Month',
      value: 12,
      description: 'Leave requests',
      icon: CheckCircle,
      variant: 'success' as const,
      trend: { value: 12.5, isPositive: true },
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconColor: 'text-green-600',
    },
    {
      title: 'Rejected This Month',
      value: 2,
      description: 'Leave requests',
      icon: XCircle,
      variant: 'destructive' as const,
      color: 'bg-gradient-to-br from-red-500 to-rose-600',
      iconColor: 'text-red-600',
    },
  ];

  // Real data from backend - map recent activities to the expected format
  const recentRequests = dashboardData?.leaveRequests?.map((request: LeaveRequest) => ({
    id: request.id,
    employee: request.employee?.name || 'Unknown Employee',
    department: request.employee?.department || 'Engineering',
    type: request.leaveType || 'Leave Request',
    dates: request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A',
    status: request.status || 'pending',
    submittedAt: request.submittedAt ? new Date(request.submittedAt).toLocaleString() : 'N/A',
    avatar: request.employee?.name ? request.employee.name.charAt(0).toUpperCase() : 'U',
    priority: 'normal' // Default priority
  })) || [];
  
  // Map department stats to expected format (using mock data for now)
  const departmentStats = [
    {
      name: 'Engineering',
      employees: 25,
      onLeave: 3,
      efficiency: 88,
      leaveRequests: 5,
      leaveDaysUsed: 45,
      leaveDaysRemaining: 155
    }
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.name}. Here's what's happening with your organization.`}
        icon={LayoutDashboard}
        iconColor="from-blue-600 to-purple-600"
      >
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
          className="bg-white/50 border-white/20 hover:bg-white/80"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </PageHeader>


      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="group relative h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full flex flex-col">
              <div className="flex items-center justify-between flex-1">
                <div className="space-y-1 lg:space-y-2 flex-1">
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.description}</p>
                </div>
                <div className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex-shrink-0">
                  <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.trend ? (
                  <div className="flex items-center">
                    {stat.trend.isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.value}%
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-transparent">
                    &nbsp;
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Leave Requests */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xl">Recent Leave Requests</span>
              <Badge variant="secondary" className="ml-auto">
                {recentRequests.length} requests
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.map((request, index) => (
                <div
                  key={request.id}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:border-blue-200 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {request.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">{request.employee}</p>
                          <p className="text-sm text-slate-600">
                            {request.department} • <span className="font-medium">{request.type}</span>
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {request.dates}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={getStatusVariant(request.status)}
                          className={`px-3 py-1 ${
                            request.status === 'pending' 
                              ? 'bg-amber-100 text-amber-800 border-amber-200' 
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {request.status}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{request.submittedAt}</p>
                          {request.priority === 'high' && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-xs text-red-600 font-medium">High Priority</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start group hover:scale-105 transition-transform duration-200" 
              variant="outline"
              onClick={() => navigate('/admin/employees')}
            >
              <Users className="mr-2 h-4 w-4 group-hover:text-blue-600" />
              Manage Employees
            </Button>
            <Button 
              className="w-full justify-start group hover:scale-105 transition-transform duration-200" 
              variant="outline"
              onClick={() => navigate('/admin/leave-requests')}
            >
              <FileText className="mr-2 h-4 w-4 group-hover:text-green-600" />
              View Leave Requests
            </Button>
            <Button 
              className="w-full justify-start group hover:scale-105 transition-transform duration-200" 
              variant="outline"
              onClick={() => navigate('/admin/policies')}
            >
              <AlertCircle className="mr-2 h-4 w-4 group-hover:text-orange-600" />
              Review Policies
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            Department Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept, index) => (
              <div key={dept.name} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    <span className="font-medium text-slate-900">{dept.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {dept.employees} employees
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{dept.onLeave} on leave</p>
                      <p className="text-xs text-slate-500">This week</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{dept.efficiency}%</p>
                      <p className="text-xs text-slate-500">Efficiency</p>
                    </div>
                  </div>
                </div>
                <Progress 
                  value={dept.efficiency} 
                  className="h-2 bg-slate-200"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;