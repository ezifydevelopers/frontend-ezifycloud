import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import LeaveBalanceCard from '@/components/ui/LeaveBalanceCard';
import { 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  MapPin,
  Clock,
  Star,
  Award,
  Target,
  TrendingUp,
  Users,
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase,
  GraduationCap,
  Heart,
  Coffee,
  Home,
  Workflow,
  Activity,
  BarChart3,
  Crown,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { managerAPI } from '@/lib/api';

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
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  birthday?: string;
  anniversary?: string;
}

const TeamMemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchMemberDetails(id);
    }
  }, [id]);

  const fetchMemberDetails = async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await managerAPI.getTeamMemberById(memberId);
      
      if (response.success && response.data) {
        console.log('🔍 TeamMemberDetailPage: API Response:', response);
        console.log('🔍 TeamMemberDetailPage: Member data:', response.data);
        console.log('🔍 TeamMemberDetailPage: Leave balance:', (response.data as any).leaveBalance);
        setMember(response.data as TeamMember);
      } else {
        setError('Member not found');
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      setError('Failed to fetch member details');
      toast({
        title: 'Error',
        description: 'Failed to fetch member details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-muted-foreground">Loading member details...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Member Not Found</h3>
            <p className="text-muted-foreground mb-4">{error || 'The requested team member could not be found'}</p>
            <Button onClick={() => navigate('/manager/team')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/manager/team')}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xl">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {member.name}
                  </h1>
                  <p className="text-muted-foreground text-lg">{member.position}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/50 border-white/20 hover:bg-white/80">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/manager/team/${member.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Member
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Basic Information</CardTitle>
                    <p className="text-sm text-muted-foreground">Personal and contact details</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-lg font-semibold">{member.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <p className="text-lg font-semibold">{member.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-lg font-semibold">{member.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant="outline" className={`text-xs ${getStatusColor(member.status)}`}>
                        {getStatusIcon(member.status)}
                        <span className="ml-1">{member.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-lg font-semibold">{member.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-lg font-semibold">{member.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Join Date</label>
                    <p className="text-lg font-semibold">{new Date(member.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manager</label>
                    <p className="text-lg font-semibold">{member.manager || 'Not assigned'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills and Projects */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Skills & Projects</CardTitle>
                    <p className="text-sm text-muted-foreground">Professional capabilities and current work</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {member.skills && member.skills.length > 0 ? (
                      member.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No skills listed</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">Current Projects</label>
                  <div className="flex flex-wrap gap-2">
                    {member.currentProjects && member.currentProjects.length > 0 ? (
                      member.currentProjects.map((project, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {project}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No current projects</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            {member.performance && typeof member.performance === 'number' && (
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Performance</CardTitle>
                      <p className="text-sm text-muted-foreground">Current performance metrics</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Overall Performance</span>
                      <span className={`text-lg font-bold ${getPerformanceColor(member.performance)}`}>
                        {member.performance}%
                      </span>
                    </div>
                    <Progress value={member.performance} className="h-2" />
                    <div className="flex items-center space-x-1">
                      <Star className={`h-4 w-4 ${getPerformanceColor(member.performance)}`} />
                      <span className={`text-sm font-medium ${getPerformanceColor(member.performance)}`}>
                        {member.performance >= 90 ? 'Excellent' : member.performance >= 70 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Quick Stats</CardTitle>
                    <p className="text-sm text-muted-foreground">Key metrics</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Direct Reports</span>
                  <span className="font-semibold">{member.directReports || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Years with Company</span>
                  <span className="font-semibold">
                    {Math.floor((new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(member.status)}`}>
                    {getStatusIcon(member.status)}
                    <span className="ml-1">{member.status}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Leave Balance */}
            <LeaveBalanceCard 
              leaveBalance={member.leaveBalance} 
              title="Leave Balance"
              showTitle={true}
              compact={false}
            />

            {/* Emergency Contact */}
            {(member.emergencyContact || member.emergencyPhone) && (
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Emergency Contact</CardTitle>
                      <p className="text-sm text-muted-foreground">Emergency information</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.emergencyContact && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                      <p className="font-semibold">{member.emergencyContact}</p>
                    </div>
                  )}
                  {member.emergencyPhone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <p className="font-semibold">{member.emergencyPhone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberDetailPage;
