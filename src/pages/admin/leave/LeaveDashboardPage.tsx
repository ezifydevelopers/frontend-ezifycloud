import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { withDashboardData, WithDashboardDataProps } from '@/components/hoc/withDashboardData';
import {
  LayoutDashboard,
  Calendar,
  RefreshCw,
  Clock as ClockIcon,
  FileText,
  BookOpen,
  Flag,
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Zap
} from 'lucide-react';

const LeaveDashboardPage: React.FC<WithDashboardDataProps> = ({ 
  dashboardData: centralizedData, 
  refreshDashboardData, 
  isRefreshing 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    await refreshDashboardData();
  };

  const stats = {
    totalRequests: centralizedData?.totalRequests || 0,
    pendingRequests: centralizedData?.pendingRequests || 0,
    approvedRequests: centralizedData?.approvedRequests || 0,
    rejectedRequests: centralizedData?.rejectedRequests || 0,
  };

  const quickActions = [
    {
      icon: FileText,
      label: 'Leave Requests',
      description: 'Manage all leave requests',
      href: '/admin/leave-management/requests',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: BookOpen,
      label: 'Leave Policies',
      description: 'Configure leave policies',
      href: '/admin/leave-management/policies',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Flag,
      label: 'Holidays',
      description: 'Manage public holidays',
      href: '/admin/leave-management/holidays',
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: BarChart3,
      label: 'Reports & Analytics',
      description: 'View leave reports and trends',
      href: '/admin/leave-management/reports',
      color: 'from-purple-500 to-pink-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ width: '100%', maxWidth: '1088px', boxSizing: 'border-box' }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                      <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Leave Management Dashboard
                      </h1>
                    </div>
                  </div>
                  <p className="text-slate-600 text-base lg:text-lg">
                    Overview of leave requests, policies, and analytics
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-700 font-medium">System Online</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="bg-white/50 border-white/20 hover:bg-white/80"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Total Requests</p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stats.totalRequests}</p>
                    <p className="text-xs text-slate-500">All time</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Pending</p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stats.pendingRequests}</p>
                    <p className="text-xs text-slate-500">Awaiting review</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Approved</p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stats.approvedRequests}</p>
                    <p className="text-xs text-slate-500">This period</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">Rejected</p>
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stats.rejectedRequests}</p>
                    <p className="text-xs text-slate-500">This period</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-white/20 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => navigate(action.href)}
                      className="group relative p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] text-left"
                    >
                      <div className={`p-2 bg-gradient-to-r ${action.color} rounded-lg w-fit mb-3`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">{action.label}</h3>
                      <p className="text-xs text-slate-600 mb-3">{action.description}</p>
                      <div className="flex items-center text-sm text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                        <span>Open</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const LeaveDashboardPageWithData = withDashboardData(LeaveDashboardPage);
export default LeaveDashboardPageWithData;

