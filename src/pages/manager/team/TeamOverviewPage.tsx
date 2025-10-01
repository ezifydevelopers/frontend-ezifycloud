import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Award,
  Target,
  Zap,
  Building2,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'offline';
  performance: {
    rating: number;
    tasksCompleted: number;
    totalTasks: number;
    efficiency: number;
  };
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
  };
  lastActive: string;
  joinDate: string;
  skills: string[];
  currentProjects: string[];
  manager: string;
  directReports?: number;
}

const TeamOverviewPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    performance: 'all',
  });

  // Mock data
  const mockTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      phone: '+1-555-0123',
      department: 'Engineering',
      position: 'Senior Developer',
      avatar: 'AJ',
      status: 'active',
      performance: {
        rating: 4.8,
        tasksCompleted: 24,
        totalTasks: 26,
        efficiency: 92,
      },
      leaveBalance: {
        annual: 15,
        sick: 8,
        casual: 5,
      },
      lastActive: '2 hours ago',
      joinDate: '2022-03-15',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      currentProjects: ['Project Alpha', 'Project Beta'],
      manager: 'John Manager',
      directReports: 3,
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob.smith@company.com',
      phone: '+1-555-0124',
      department: 'Marketing',
      position: 'Marketing Specialist',
      avatar: 'BS',
      status: 'on-leave',
      performance: {
        rating: 4.5,
        tasksCompleted: 18,
        totalTasks: 20,
        efficiency: 90,
      },
      leaveBalance: {
        annual: 12,
        sick: 6,
        casual: 3,
      },
      lastActive: '1 day ago',
      joinDate: '2021-08-20',
      skills: ['Digital Marketing', 'SEO', 'Analytics', 'Content Creation'],
      currentProjects: ['Campaign 2024'],
      manager: 'John Manager',
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol.davis@company.com',
      phone: '+1-555-0125',
      department: 'HR',
      position: 'HR Coordinator',
      avatar: 'CD',
      status: 'active',
      performance: {
        rating: 4.9,
        tasksCompleted: 22,
        totalTasks: 23,
        efficiency: 96,
      },
      leaveBalance: {
        annual: 18,
        sick: 9,
        casual: 6,
      },
      lastActive: '30 minutes ago',
      joinDate: '2020-11-10',
      skills: ['Recruitment', 'Employee Relations', 'HRIS', 'Training'],
      currentProjects: ['Talent Acquisition', 'Employee Engagement'],
      manager: 'John Manager',
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david.wilson@company.com',
      phone: '+1-555-0126',
      department: 'Sales',
      position: 'Sales Representative',
      avatar: 'DW',
      status: 'active',
      performance: {
        rating: 4.3,
        tasksCompleted: 16,
        totalTasks: 20,
        efficiency: 80,
      },
      leaveBalance: {
        annual: 10,
        sick: 7,
        casual: 4,
      },
      lastActive: '1 hour ago',
      joinDate: '2023-01-15',
      skills: ['Sales', 'CRM', 'Negotiation', 'Lead Generation'],
      currentProjects: ['Q4 Sales Push'],
      manager: 'John Manager',
    },
    {
      id: '5',
      name: 'Emma Brown',
      email: 'emma.brown@company.com',
      phone: '+1-555-0127',
      department: 'Engineering',
      position: 'Frontend Developer',
      avatar: 'EB',
      status: 'offline',
      performance: {
        rating: 4.6,
        tasksCompleted: 20,
        totalTasks: 22,
        efficiency: 91,
      },
      leaveBalance: {
        annual: 14,
        sick: 8,
        casual: 5,
      },
      lastActive: '3 hours ago',
      joinDate: '2022-09-01',
      skills: ['Vue.js', 'CSS', 'UI/UX', 'Figma'],
      currentProjects: ['UI Redesign'],
      manager: 'John Manager',
    },
  ];

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTeamMembers(mockTeamMembers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || member.status === filters.status;
    const matchesDepartment = filters.department === 'all' || member.department === filters.department;
    const matchesPerformance = filters.performance === 'all' || 
      (filters.performance === 'high' && member.performance.rating >= 4.5) ||
      (filters.performance === 'medium' && member.performance.rating >= 4.0 && member.performance.rating < 4.5) ||
      (filters.performance === 'low' && member.performance.rating < 4.0);
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesPerformance;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-leave':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-800 border-green-200';
    if (rating >= 4.0) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Mock statistics
  const stats = [
    {
      title: 'Team Size',
      value: teamMembers.length,
      description: 'Total members',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: { value: 8.3, isPositive: true },
    },
    {
      title: 'Active Members',
      value: teamMembers.filter(member => member.status === 'active').length,
      description: 'Currently working',
      icon: UserCheck,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: 'Avg Performance',
      value: (teamMembers.reduce((sum, member) => sum + member.performance.rating, 0) / teamMembers.length).toFixed(1),
      description: 'Team rating',
      icon: Star,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      trend: { value: 5.2, isPositive: true },
    },
    {
      title: 'Avg Efficiency',
      value: `${Math.round(teamMembers.reduce((sum, member) => sum + member.performance.efficiency, 0) / teamMembers.length)}%`,
      description: 'Team productivity',
      icon: Target,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Team Overview
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Monitor your team's performance, availability, and key metrics.
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
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200/50 focus:border-green-300 focus:ring-green-200"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32 bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger className="w-40 bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.performance} onValueChange={(value) => setFilters(prev => ({ ...prev, performance: value }))}>
                  <SelectTrigger className="w-40 bg-white/50 border-slate-200/50">
                    <SelectValue placeholder="Performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Performance</SelectItem>
                    <SelectItem value="high">High (4.5+)</SelectItem>
                    <SelectItem value="medium">Medium (4.0-4.5)</SelectItem>
                    <SelectItem value="low">Low (&lt;4.0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xl">Team Members ({filteredMembers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="font-semibold">Member</TableHead>
                    <TableHead className="font-semibold">Position</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Performance</TableHead>
                    <TableHead className="font-semibold">Efficiency</TableHead>
                    <TableHead className="font-semibold">Leave Balance</TableHead>
                    <TableHead className="font-semibold">Last Active</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member, index) => (
                    <TableRow 
                      key={member.id} 
                      className="group hover:bg-slate-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white font-semibold">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                            <p className="text-xs text-slate-400">{member.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{member.position}</p>
                          <p className="text-sm text-slate-500">Joined {new Date(member.joinDate).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(member.performance.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Badge className={getPerformanceColor(member.performance.rating)}>
                            {member.performance.rating}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={member.performance.efficiency} 
                            className="w-16 h-2 bg-slate-200"
                          />
                          <span className={`text-sm font-medium ${getEfficiencyColor(member.performance.efficiency)}`}>
                            {member.performance.efficiency}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Annual:</span>
                            <span className="font-medium">{member.leaveBalance.annual}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Sick:</span>
                            <span className="font-medium">{member.leaveBalance.sick}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Casual:</span>
                            <span className="font-medium">{member.leaveBalance.casual}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-slate-900">{member.lastActive}</p>
                          <p className="text-slate-500">{member.currentProjects.length} projects</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-white/20">
                            <DropdownMenuItem className="hover:bg-blue-50 hover:text-blue-700">
                              <Mail className="mr-2 h-4 w-4" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-green-50 hover:text-green-700">
                              <Calendar className="mr-2 h-4 w-4" />
                              View Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-purple-50 hover:text-purple-700">
                              <Activity className="mr-2 h-4 w-4" />
                              View Performance
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Performance Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers
                .sort((a, b) => b.performance.rating - a.performance.rating)
                .slice(0, 3)
                .map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{member.performance.rating}</p>
                      <p className="text-xs text-slate-500">rating</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              Team Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(new Set(teamMembers.flatMap(member => member.skills)))
                .slice(0, 6)
                .map((skill, index) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                  >
                    <span className="text-sm font-medium text-slate-900">{skill}</span>
                    <Badge variant="outline" className="text-xs">
                      {teamMembers.filter(member => member.skills.includes(skill)).length} members
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamOverviewPage;