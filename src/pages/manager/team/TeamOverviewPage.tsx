import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/layout/PageHeader';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Zap,
  Building2,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  Sparkles,
  CalendarDays,
  Clock3,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Coffee,
  Home,
  Workflow,
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
import { managerAPI } from '@/lib/api';
import { User } from '@/types/auth';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'offline';
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
  };
  joinDate: string;
  skills: string[];
  currentProjects: string[];
  manager: string;
  directReports?: number;
  performance?: number;
  lastActive?: string;
  location?: string;
  bio?: string;
}

const TeamOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for team statistics
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    onLeaveMembers: 0,
    averagePerformance: 0,
  });

  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await managerAPI.getTeamMembers({
        limit: 100,
        status: filters.status as 'active' | 'inactive' | 'all',
        department: filters.department === 'all' ? undefined : filters.department,
      });

      if (response.success && response.data) {
        const members = Array.isArray(response.data) ? response.data : response.data.data || [];
        console.log('🔍 Team Members Data:', members);
        setTeamMembers(members as TeamMember[]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Failed to fetch team members');
      toast({
        title: 'Error',
        description: 'Failed to fetch team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchTeamStats = useCallback(async () => {
    try {
      const response = await managerAPI.getTeamStats();
      if (response.success && response.data) {
        console.log('🔍 Team Stats Data:', response.data);
        setTeamStats({
          totalMembers: (response.data as unknown as Record<string, number>).totalMembers || 0,
          activeMembers: (response.data as unknown as Record<string, number>).activeMembers || 0,
          onLeaveMembers: (response.data as unknown as Record<string, number>).onLeaveMembers || 0,
          averagePerformance: (response.data as unknown as Record<string, number>).averagePerformance || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await managerAPI.getTeamDepartments();
      if (response.success && response.data) {
        setDepartments(response.data as string[]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
    fetchTeamStats();
    fetchDepartments();
  }, [fetchTeamMembers, fetchTeamStats, fetchDepartments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTeamMembers(), fetchTeamStats()]);
    setIsRefreshing(false);
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || member.status === filters.status;
    const matchesDepartment = filters.department === 'all' || member.department === filters.department;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'on-leave': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'offline': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'on-leave': return <Calendar className="h-3 w-3" />;
      case 'offline': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (typeof performance !== 'number') return 'text-gray-600';
    if (performance >= 90) return 'text-green-600';
    if (performance >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader
          title="Team Overview"
          subtitle="Manage and monitor your team members"
          icon={Users}
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
          <Button
            onClick={() => navigate('/manager/team/add')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </PageHeader>
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Members</p>
                  <p className="text-2xl font-bold text-slate-900 mb-1">{teamStats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Team size</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Members</p>
                  <p className="text-2xl font-bold text-slate-900 mb-1">{teamStats.activeMembers}</p>
                  <p className="text-xs text-muted-foreground">Currently working</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">On Leave</p>
                  <p className="text-2xl font-bold text-slate-900 mb-1">{teamStats.onLeaveMembers}</p>
                  <p className="text-xs text-muted-foreground">Currently away</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg Performance</p>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {typeof teamStats.averagePerformance === 'number' 
                      ? `${teamStats.averagePerformance}%` 
                      : '0%'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Team average</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, email, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-white/20 focus:bg-white/80"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32 bg-white/50 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger className="w-40 bg-white/50 border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members List */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Team Members</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredMembers.map((member, index) => (
                <div
                  key={member.id}
                  className={`group flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors ${
                    index !== filteredMembers.length - 1 ? 'border-b border-slate-200/50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </h3>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(member.status)}`}>
                          {getStatusIcon(member.status)}
                          <span className="ml-1">{member.status}</span>
                        </Badge>
                        {member.performance && typeof member.performance === 'number' && (
                          <div className="flex items-center space-x-1">
                            <Star className={`h-3 w-3 ${getPerformanceColor(member.performance)}`} />
                            <span className={`text-xs font-medium ${getPerformanceColor(member.performance)}`}>
                              {member.performance}%
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{member.position}</p>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>{member.department}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate max-w-48">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {member.skills && member.skills.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {member.skills.slice(0, 5).map((skill, skillIndex) => (
                              <Badge key={skillIndex} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {member.skills.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{member.skills.length - 5}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.directReports && (
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="font-medium">{member.directReports}</div>
                        <div className="text-xs">reports</div>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/manager/team/${member.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/manager/team/${member.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {filteredMembers.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No team members found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filters.status !== 'all' || filters.department !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'No team members to display at the moment'
                }
              </p>
              {(searchTerm || filters.status !== 'all' || filters.department !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ status: 'all', department: 'all' });
                  }}
                  className="bg-white/50 border-white/20"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamOverviewPage;