import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/layout/PageHeader';
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
} from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, loading, error, refreshDashboard } = useDashboard();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDashboard();
    setIsRefreshing(false);
  };

  // Extract data from dashboard context
  const stats = dashboardData?.stats ? {
    teamMembers: dashboardData.stats.teamSize || 6,
    pendingApprovals: dashboardData.stats.pendingApprovals || 3,
    approvedThisMonth: dashboardData.stats.approvedThisMonth || 8,
    teamCapacity: dashboardData.stats.activeTeamMembers || 6,
  } : {
    teamMembers: 6,
    pendingApprovals: 3,
    approvedThisMonth: 8,
    teamCapacity: 6,
  };

  console.log('🔍 ManagerDashboard: dashboardData:', dashboardData);
  console.log('🔍 ManagerDashboard: stats:', stats);

  const pendingRequests = dashboardData?.leaveRequests || [];
  const teamSchedule = []; // Mock data for now

  const performanceData = {
    responseTime: 24,
    approvalRate: 50,
    teamSatisfaction: 4.2,
    productivity: 75,
    attendance: 95,
    engagement: 88
  };

  // Stats cards configuration
  const statsCards = [
    {
      title: 'Team Members',
      value: stats.teamMembers,
      description: 'Active team members',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      description: 'Awaiting your review',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      trend: { value: 3, isPositive: false }
    },
    {
      title: 'Approved This Month',
      value: stats.approvedThisMonth,
      description: 'Successfully processed',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Team Capacity',
      value: `${stats.teamCapacity}%`,
      description: 'Current availability',
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      trend: { value: 5, isPositive: true }
    }
  ];


  if (loading && !dashboardData) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Try Again
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsCards.map((stat, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <CardContent className="relative p-6 h-full flex flex-col">
                <div className="flex items-center justify-between flex-1">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
          </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg flex-shrink-0`}>
                    <stat.icon className="h-5 w-5 text-white" />
        </div>
                </div>
                <div className="flex items-center mt-2">
                  <span className={`text-xs font-medium ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>

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
                    {pendingRequests.length} pending
                  </Badge>
                </div>
              </CardHeader>
          <CardContent>
              {pendingRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pendingRequests.slice(0, 5).map((request: unknown, index: number) => {
                      const req = request as { id?: string; employee?: { name?: string }; leaveType?: string; status?: string };
                      return (
                      <div
                        key={req.id || index}
                        className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                              {req.employee?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{req.employee?.name || 'Unknown Employee'}</p>
                            <p className="text-sm text-muted-foreground">{req.leaveType || 'Leave Request'}</p>
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

            {/* Team Status */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Team Status</CardTitle>
                    <p className="text-sm text-muted-foreground">Current team availability</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Available</span>
                    <span className="text-lg font-bold text-green-600">{stats.teamCapacity}%</span>
                  </div>
                  <Progress value={stats.teamCapacity} className="h-2" />
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">On Leave</span>
                      <span className="font-medium">3 members</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Working</span>
                      <span className="font-medium">{stats.teamMembers - 3} members</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total Team</span>
                      <span className="font-medium">{stats.teamMembers} members</span>
                    </div>
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

export default ManagerDashboard;