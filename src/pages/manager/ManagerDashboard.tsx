import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { managerAPI } from '@/lib/api';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Clock,
  CheckCircle,
  Calendar,
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
  BarChart3,
} from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data for demonstration
  const stats = [
    {
      title: 'Team Members',
      value: 12,
      description: 'Direct reports',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pending Approvals',
      value: 5,
      description: 'Require your action',
      icon: Clock,
      variant: 'pending' as const,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Approved This Month',
      value: 18,
      description: 'Leave requests',
      icon: CheckCircle,
      variant: 'success' as const,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      iconColor: 'text-green-600',
    },
    {
      title: 'Team Capacity',
      value: '83%',
      description: 'Available this week',
      icon: Calendar,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      iconColor: 'text-purple-600',
    },
  ];

  const pendingRequests = [
    {
      id: '1',
      employee: 'Alice Johnson',
      type: 'Annual Leave',
      dates: 'Dec 22-30, 2024',
      days: 7,
      reason: 'Christmas vacation with family',
      submittedAt: '2 hours ago',
      avatar: 'AJ',
      priority: 'high',
    },
    {
      id: '2',
      employee: 'Bob Smith',
      type: 'Sick Leave',
      dates: 'Dec 16, 2024',
      days: 1,
      reason: 'Doctor appointment',
      submittedAt: '1 day ago',
      avatar: 'BS',
      priority: 'medium',
    },
    {
      id: '3',
      employee: 'Carol Davis',
      type: 'Casual Leave',
      dates: 'Dec 20-21, 2024',
      days: 2,
      reason: 'Personal work',
      submittedAt: '2 days ago',
      avatar: 'CD',
      priority: 'low',
    },
  ];

  const teamSchedule = [
    { name: 'Alice Johnson', status: 'working', avatar: 'AJ', efficiency: 95 },
    { name: 'Bob Smith', status: 'on-leave', avatar: 'BS', leaveType: 'Sick', efficiency: 88 },
    { name: 'Carol Davis', status: 'working', avatar: 'CD', efficiency: 92 },
    { name: 'David Wilson', status: 'working', avatar: 'DW', efficiency: 90 },
    { name: 'Emma Brown', status: 'on-leave', avatar: 'EB', leaveType: 'Annual', efficiency: 87 },
    { name: 'Frank Miller', status: 'working', avatar: 'FM', efficiency: 94 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-leave':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Manager Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Hello <span className="font-semibold text-green-600">{user?.name}</span>, manage your team's leave requests and track availability.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Team Active</span>
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
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Pending Approvals */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xl">Pending Approvals</span>
              <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">
                {pendingRequests.length} requests
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request, index) => (
                <div
                  key={request.id}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:border-amber-200 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-semibold">
                            {request.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">{request.employee}</p>
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">{request.type}</span> • {request.days} days
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {request.dates}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 italic">"{request.reason}"</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={`px-3 py-1 ${getPriorityColor(request.priority)}`}
                        >
                          {request.priority} priority
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{request.submittedAt}</p>
                          <div className="flex space-x-2 mt-2">
                            <Button size="sm" className="h-8 px-3 bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 px-3">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Schedule */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              Team Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamSchedule.map((member, index) => (
                <div
                  key={member.name}
                  className="group flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">
                        {member.status === 'on-leave' ? `On ${member.leaveType} Leave` : 'Working'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(member.status)}>
                      {member.status === 'working' ? 'Active' : 'On Leave'}
                    </Badge>
                    {member.efficiency && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-green-600">{member.efficiency}%</p>
                        <p className="text-xs text-slate-400">Efficiency</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
              onClick={() => navigate('/manager/approvals')}
            >
              <FileText className="mr-2 h-4 w-4 group-hover:text-blue-600" />
              Review All Requests
            </Button>
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
              onClick={() => navigate('/manager/calendar')}
            >
              <Calendar className="mr-2 h-4 w-4 group-hover:text-green-600" />
              Team Calendar
            </Button>
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
              onClick={() => navigate('/manager/team')}
            >
              <Users className="mr-2 h-4 w-4 group-hover:text-purple-600" />
              Team Overview
            </Button>
            <Button 
              variant="outline" 
              className="justify-start group hover:scale-105 transition-transform duration-200"
              onClick={() => navigate('/manager/settings')}
            >
              <AlertCircle className="mr-2 h-4 w-4 group-hover:text-orange-600" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;