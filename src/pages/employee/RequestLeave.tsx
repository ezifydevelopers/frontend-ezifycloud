import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [loading, setLoading] = useState(false);

  // Mock leave balance data
  const leaveBalance = {
    annual: { remaining: 13, total: 25, used: 12 },
    sick: { remaining: 8, total: 10, used: 2 },
    casual: { remaining: 5, total: 8, used: 3 },
  };

  // Mock recent requests
  const recentRequests = [
    {
      id: '1',
      type: 'Annual Leave',
      startDate: '2024-12-20',
      endDate: '2024-12-22',
      days: 3,
      status: 'pending',
      submittedAt: '2024-12-15T10:30:00Z',
    },
    {
      id: '2',
      type: 'Sick Leave',
      startDate: '2024-12-10',
      endDate: '2024-12-10',
      days: 1,
      status: 'approved',
      submittedAt: '2024-12-09T14:20:00Z',
    },
    {
      id: '3',
      type: 'Casual Leave',
      startDate: '2024-12-05',
      endDate: '2024-12-05',
      days: 1,
      status: 'rejected',
      submittedAt: '2024-12-04T09:15:00Z',
    },
  ];

  const handleFormSubmit = async (data: unknown) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Leave request submitted',
        description: 'Your leave request has been sent to your manager for approval.',
      });
      
      navigate('/employee/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit leave request. Please try again.',
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

  // Mock statistics
  const stats = [
    {
      title: 'Total Leave Days',
      value: 43,
      description: 'Available this year',
      icon: Calendar,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: { value: 5.2, isPositive: true },
    },
    {
      title: 'Used This Year',
      value: 17,
      description: 'Days taken',
      icon: Clock,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
    {
      title: 'Pending Requests',
      value: 1,
      description: 'Awaiting approval',
      icon: AlertCircle,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'Approval Rate',
      value: '85%',
      description: 'Success rate',
      icon: Target,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      trend: { value: 8.3, isPositive: true },
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Request Leave
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Submit a new leave request. Your manager will be notified for approval.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Profile Active</span>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leave Balance Summary */}
        <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xl">Leave Balance</span>
            </CardTitle>
            <CardDescription>Your remaining leave days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(leaveBalance).map(([type, balance], index) => {
              const percentage = (balance.remaining / balance.total) * 100;
              const getProgressColor = (percent: number) => {
                if (percent >= 70) return 'bg-green-500';
                if (percent >= 40) return 'bg-yellow-500';
                return 'bg-red-500';
              };

              return (
                <div
                  key={type}
                  className="p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="font-medium capitalize text-slate-900">{type}</span>
                    </div>
                    <Badge variant="outline" className="font-semibold">
                      {balance.remaining}/{balance.total}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Remaining: {balance.remaining} days</span>
                      <span>Used: {balance.used} days</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2 bg-slate-200"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{Math.round(percentage)}% remaining</span>
                      <span>{balance.total - balance.remaining} days used</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Leave Request Form */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xl">New Leave Request</span>
            </CardTitle>
            <CardDescription>
              Fill out the form below to submit your leave request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveRequestForm onSubmit={handleFormSubmit} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock3 className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xl">Recent Requests</span>
          </CardTitle>
          <CardDescription>Your recent leave request history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRequests.map((request, index) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-slate-900">{request.type}</h4>
                      <Badge className={getLeaveTypeColor(request.type)}>
                        {request.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{request.days} days</p>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Info className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-xl">Quick Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/50">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Advance Notice</h4>
                <p className="text-sm text-blue-700">Submit requests at least 2 days in advance for better approval chances.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200/50">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Documentation</h4>
                <p className="text-sm text-green-700">Provide clear reasons and any supporting documents for your request.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/50">
              <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900">Peak Times</h4>
                <p className="text-sm text-purple-700">Avoid requesting leave during busy periods or team deadlines.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/50">
              <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900">Planning</h4>
                <p className="text-sm text-orange-700">Plan your leave requests early to ensure availability and approval.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestLeave;