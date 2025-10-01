import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  FileText,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart,
  Target,
  Award,
  Star,
  Zap,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import LeaveTrendsChart from './components/LeaveTrendsChart';
import DepartmentStats from './components/DepartmentStats';
import LeaveBalanceReport from './components/LeaveBalanceReport';

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(false);

  const departments = [
    'All Departments',
    'Engineering',
    'Human Resources',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Customer Support',
    'IT',
  ];

  const periods = [
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'thisYear', label: 'This Year' },
  ];

  const handleExportReport = async (reportType: string) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Report exported',
        description: `${reportType} report has been downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Data refreshed',
        description: 'Report data has been updated',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock statistics
  const stats = [
    {
      title: 'Total Reports',
      value: 24,
      description: 'Generated this month',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: 'Active Users',
      value: 156,
      description: 'Report viewers',
      icon: Users,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      trend: { value: 8.3, isPositive: true },
    },
    {
      title: 'Data Points',
      value: '2.4K',
      description: 'Processed today',
      icon: Activity,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      trend: { value: 15.2, isPositive: true },
    },
    {
      title: 'Export Success',
      value: '98.5%',
      description: 'Export success rate',
      icon: Download,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
  ];

  const reportTypes = [
    {
      id: 'leave-summary',
      title: 'Leave Summary Report',
      description: 'Comprehensive overview of all leave requests and approvals',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      lastGenerated: '2 hours ago',
    },
    {
      id: 'department-analysis',
      title: 'Department Analysis',
      description: 'Detailed breakdown by department and team performance',
      icon: PieChart,
      color: 'bg-green-100 text-green-800 border-green-200',
      lastGenerated: '1 day ago',
    },
    {
      id: 'trend-analysis',
      title: 'Trend Analysis',
      description: 'Historical trends and patterns in leave requests',
      icon: LineChart,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      lastGenerated: '3 days ago',
    },
    {
      id: 'compliance-report',
      title: 'Compliance Report',
      description: 'Policy compliance and regulatory requirements',
      icon: Target,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      lastGenerated: '1 week ago',
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      description: 'Key performance indicators and benchmarks',
      icon: Award,
      color: 'bg-pink-100 text-pink-800 border-pink-200',
      lastGenerated: '2 days ago',
    },
    {
      id: 'audit-trail',
      title: 'Audit Trail Report',
      description: 'Complete audit trail of all system activities',
      icon: Clock,
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      lastGenerated: '4 hours ago',
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Reports & Analytics
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Generate comprehensive reports and analyze organizational data.
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <stat.icon className={`h-6 w-6 text-white`} />
                </div>
              </div>
              {stat.trend && (
                <div className="flex items-center mt-4">
                  {stat.trend.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend.value}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <Label htmlFor="period">Time Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-40 bg-white/50 border-slate-200/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48 bg-white/50 border-slate-200/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept.toLowerCase().replace(' ', '-')}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={loading}
                className="hover:bg-blue-50 hover:text-blue-700"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => handleExportReport('all')}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report, index) => (
          <Card
            key={report.id}
            className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                    <report.icon className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-slate-500">Last generated: {report.lastGenerated}</p>
                  </div>
                </div>
                <Badge className={report.color}>
                  Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">{report.description}</p>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport(report.id)}
                  disabled={loading}
                  className="hover:bg-blue-50 hover:text-blue-700"
                >
                  <Download className="mr-2 h-3 w-3" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-50"
                >
                  <FileText className="mr-2 h-3 w-3" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Leave Trends Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              Leave Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeaveTrendsChart />
          </CardContent>
        </Card>

        {/* Department Stats */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              Department Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentStats />
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Report */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PieChart className="h-5 w-5 text-purple-600" />
            </div>
            Leave Balance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveBalanceReport />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;