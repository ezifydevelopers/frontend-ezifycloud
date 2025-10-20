import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Calendar, 
  Clock, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Zap,
  UserCheck,
  UserX,
  CalendarDays,
  Clock3,
  MapPin,
  Building2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { managerAPI } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';

interface TeamCapacityData {
  totalMembers: number;
  activeMembers: number;
  onLeave: number;
  available: number;
  utilizationRate: number;
  capacityScore: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  avatar?: string;
  status: 'active' | 'on-leave' | 'offline' | 'busy';
  currentCapacity: number;
  workload: number;
  upcomingLeaves: number;
  lastActive: string;
  location?: string;
  isAvailable: boolean;
}

interface CapacityTrend {
  date: string;
  available: number;
  onLeave: number;
  busy: number;
  total: number;
}

interface UpcomingLeave {
  id: string;
  memberId: string;
  memberName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'approved' | 'pending';
}

const TeamCapacityPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [capacityData, setCapacityData] = useState<TeamCapacityData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState<UpcomingLeave[]>([]);
  const [capacityTrends, setCapacityTrends] = useState<CapacityTrend[]>([]);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchCapacityData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 TeamCapacityPage: Fetching capacity data...');
      
      // Fetch team data and current leave requests
      const [teamResponse, departmentsResponse, leavesResponse, currentLeavesResponse] = await Promise.all([
        managerAPI.getTeamMembers({ limit: 100 }),
        managerAPI.getTeamDepartments(),
        managerAPI.getUpcomingLeaves(10),
        managerAPI.getLeaveRequests({ status: 'approved', limit: 100 }) // Get approved leave requests
      ]);

      console.log('📊 TeamCapacityPage: Team response:', teamResponse);
      console.log('🏢 TeamCapacityPage: Departments response:', departmentsResponse);
      console.log('📅 TeamCapacityPage: Leaves response:', leavesResponse);
      console.log('📅 TeamCapacityPage: Current leaves response:', currentLeavesResponse);

      if (teamResponse.success && teamResponse.data) {
        const members = Array.isArray(teamResponse.data) ? teamResponse.data : teamResponse.data.data || [];
        console.log('👥 TeamCapacityPage: Processing members:', members.length);
        
        // Get current date for leave checking
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Process current leave requests to find who is on leave today
        const currentLeaves: Record<string, boolean> = {};
        if (currentLeavesResponse.success && currentLeavesResponse.data) {
          const leaves = Array.isArray(currentLeavesResponse.data) ? currentLeavesResponse.data : currentLeavesResponse.data.data || [];
          leaves.forEach((leave: Record<string, unknown>) => {
            const startDate = new Date(String(leave.startDate || leave.start_date || ''));
            const endDate = new Date(String(leave.endDate || leave.end_date || ''));
            const userId = String(leave.userId || leave.employeeId || leave.employee_id || '');
            
            // Check if today falls within the leave period
            if (startDate <= today && today <= endDate && leave.status === 'approved') {
              currentLeaves[userId] = true;
            }
          });
        }
        
        // Transform team members with accurate present/absent status
        const transformedMembers: TeamMember[] = members.map((member: Record<string, unknown>) => {
          const memberId = String(member.id || '');
          const isActive = Boolean(member.isActive);
          const lastActive = member.lastLogin || member.updatedAt || new Date().toISOString();
          const isOnLeaveToday = currentLeaves[memberId] || false;
          
          // Determine status based on leave data and activity
          let status: 'active' | 'offline' | 'on-leave' | 'busy' = 'offline';
          if (isOnLeaveToday) {
            status = 'on-leave';
          } else if (isActive) {
            // Check if user has been active recently (within last 24 hours)
            const lastActiveDate = new Date(String(lastActive));
            const hoursSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
            status = hoursSinceActive < 24 ? 'active' : 'offline';
          }
          
          return {
            id: memberId,
            name: String(member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown'),
            email: String(member.email || ''),
            department: String(member.department || 'Unknown'),
            position: String(member.position || member.jobTitle || 'Team Member'),
            avatar: String(member.avatar || member.profilePicture || ''),
            status,
            currentCapacity: 0,
            workload: 0,
            upcomingLeaves: 0,
            lastActive: String(lastActive),
            location: String(member.location || 'Office'),
            isAvailable: isActive && status === 'active' && !isOnLeaveToday
          };
        });
        
        setTeamMembers(transformedMembers);
        console.log('✅ TeamCapacityPage: Members processed:', transformedMembers.length);

        // Calculate accurate capacity data
        const totalMembers = transformedMembers.length;
        const presentMembers = transformedMembers.filter(m => m.status === 'active' && !currentLeaves[m.id]).length;
        const absentMembers = transformedMembers.filter(m => m.status === 'on-leave' || currentLeaves[m.id]).length;
        const activeMembers = transformedMembers.filter(m => m.status === 'active').length;
        const onLeave = transformedMembers.filter(m => m.status === 'on-leave').length;
        const available = transformedMembers.filter(m => m.isAvailable).length;
        
        // Calculate attendance percentage
        const attendanceRate = totalMembers > 0 ? Math.round((presentMembers / totalMembers) * 100) : 0;

        const capacityData = {
          totalMembers,
          activeMembers,
          onLeave,
          available,
          utilizationRate: attendanceRate,
          capacityScore: attendanceRate
        };

        setCapacityData(capacityData);
        console.log('📈 TeamCapacityPage: Capacity data calculated:', capacityData);
        console.log('👥 TeamCapacityPage: Present:', presentMembers, 'Absent:', absentMembers, 'Total:', totalMembers);
      } else {
        console.log('❌ TeamCapacityPage: Failed to fetch team data:', teamResponse);
        // Set default data
        setCapacityData({
          totalMembers: 0,
          activeMembers: 0,
          onLeave: 0,
          available: 0,
          utilizationRate: 0,
          capacityScore: 0
        });
        setTeamMembers([]);
      }

      if (departmentsResponse.success && departmentsResponse.data) {
        setDepartments(departmentsResponse.data as string[]);
        console.log('✅ TeamCapacityPage: Departments loaded:', departmentsResponse.data);
      } else {
        console.log('❌ TeamCapacityPage: Failed to fetch departments:', departmentsResponse);
        setDepartments(['All Departments']);
      }

      if (leavesResponse.success && leavesResponse.data) {
        const leaves = leavesResponse.data as unknown as Record<string, unknown>[];
        const transformedLeaves: UpcomingLeave[] = leaves.map((leave: Record<string, unknown>) => {
          const user = leave.user as Record<string, unknown> | undefined;
          const employee = leave.employee as Record<string, unknown> | undefined;
          
          return {
            id: String(leave.id || ''),
            memberId: String(leave.userId || leave.employeeId || leave.employee_id || ''),
            memberName: String(user?.name || leave.employeeName || employee?.name || 'Unknown'),
            leaveType: String(leave.leaveType || leave.type || ''),
            startDate: String(leave.startDate || leave.start_date || ''),
            endDate: String(leave.endDate || leave.end_date || ''),
            days: Number(leave.days || leave.totalDays || 1),
            status: leave.status === 'approved' ? 'approved' : 'pending'
          };
        });
        setUpcomingLeaves(transformedLeaves);
        console.log('✅ TeamCapacityPage: Upcoming leaves loaded:', transformedLeaves.length);
      } else {
        console.log('❌ TeamCapacityPage: Failed to fetch leaves:', leavesResponse);
        setUpcomingLeaves([]);
      }

      // Remove fake trends data - set empty array
      setCapacityTrends([]);
      console.log('📊 TeamCapacityPage: Trends removed (was fake data)');

    } catch (error) {
      console.error('❌ TeamCapacityPage: Error fetching capacity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch capacity data. Please try again.',
        variant: 'destructive',
      });
      
      // Set fallback data
      setCapacityData({
        totalMembers: 0,
        activeMembers: 0,
        onLeave: 0,
        available: 0,
        utilizationRate: 0,
        capacityScore: 0
      });
      setTeamMembers([]);
      setUpcomingLeaves([]);
      setDepartments(['All Departments']);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCapacityData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchCapacityData();
  }, [fetchCapacityData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'on-leave': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'offline': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'busy': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'on-leave': return <Calendar className="h-3 w-3" />;
      case 'offline': return <XCircle className="h-3 w-3" />;
      case 'busy': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Filter team members based on selected department
  const filteredTeamMembers = teamMembers.filter(member => {
    if (selectedDepartment === 'all') return true;
    return member.department === selectedDepartment;
  });

  // Calculate accurate present/absent numbers for filtered members
  const presentMembers = filteredTeamMembers.filter(m => m.status === 'active' && m.isAvailable);
  const onLeaveMembers = filteredTeamMembers.filter(m => m.status === 'on-leave');
  const offlineMembers = filteredTeamMembers.filter(m => m.status === 'offline');
  const totalFilteredMembers = filteredTeamMembers.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading capacity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <PageHeader
        title="Team Overview"
        subtitle="Manage and monitor your team members"
        icon={Activity}
        children={
          <div className="flex items-center space-x-3">
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="detailed">Detailed View</SelectItem>
                <SelectItem value="trends">Trends</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/90 backdrop-blur-sm border-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Present/Absent Overview Cards */}
        {capacityData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Team Members */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Total Team</CardTitle>
                    <p className="text-sm text-muted-foreground">All members</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {capacityData.totalMembers}
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">Team size</span>
                </div>
              </CardContent>
            </Card>

            {/* Present Today */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Present Today</CardTitle>
                    <p className="text-sm text-muted-foreground">Currently working</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {capacityData.totalMembers - capacityData.onLeave}
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{capacityData.utilizationRate}% attendance</span>
                </div>
              </CardContent>
            </Card>

            {/* Absent Today */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">On Leave</CardTitle>
                    <p className="text-sm text-muted-foreground">Currently away</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {capacityData.onLeave}
                </div>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="text-sm text-amber-600">Approved leave</span>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Rate */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Attendance</CardTitle>
                    <p className="text-sm text-muted-foreground">Today's rate</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {capacityData.utilizationRate}%
                </div>
                <div className="flex items-center mt-2">
                  <Progress value={capacityData.utilizationRate} className="h-2 flex-1 mr-2" />
                  <span className="text-sm text-purple-600">Rate</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Members List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Team Members</CardTitle>
                      <p className="text-sm text-muted-foreground">Current capacity and status</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {presentMembers.length} present
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {onLeaveMembers.length} on leave
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedView === 'detailed' ? (
                  <div className="space-y-4">
                    {filteredTeamMembers.map((member) => (
                      <div key={member.id} className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-slate-900">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">{member.position} • {member.department}</p>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{member.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock3 className="h-3 w-3" />
                                  <span>Last active: {new Date(member.lastActive).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={getStatusColor(member.status)}>
                              {getStatusIcon(member.status)}
                              <span className="ml-1">{member.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTeamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-100">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{member.name}</h4>
                          <Badge variant="outline" className={getStatusColor(member.status)}>
                            {getStatusIcon(member.status)}
                            <span className="ml-1">{member.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.position} • {member.department}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{member.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock3 className="h-3 w-3" />
                            <span>Last active: {new Date(member.lastActive).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getStatusColor(member.status)}>
                          {getStatusIcon(member.status)}
                          <span className="ml-1">{member.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Capacity Trends - Only show in trends view */}
            {selectedView === 'trends' && (
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Capacity Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">Availability over the past week</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capacityTrends.map((trend, index) => (
                    <div key={trend.date} className="flex items-center space-x-4">
                      <div className="w-20 text-sm font-medium text-slate-600">
                        {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Available</span>
                          <span className="font-medium text-green-600">{trend.available}</span>
                        </div>
                        <Progress value={(trend.available / trend.total) * 100} className="h-2" />
                      </div>
                      <div className="w-16 text-right">
                        <div className="text-xs text-muted-foreground">On Leave</div>
                        <div className="text-sm font-medium text-amber-600">{trend.onLeave}</div>
                      </div>
                      <div className="w-16 text-right">
                        <div className="text-xs text-muted-foreground">Busy</div>
                        <div className="text-sm font-medium text-red-600">{trend.busy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Leaves */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Upcoming Leaves</CardTitle>
                    <p className="text-sm text-muted-foreground">Scheduled time off</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingLeaves.slice(0, 5).map((leave) => (
                    <div key={leave.id} className="flex items-center space-x-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-amber-500 text-white text-xs">
                          {leave.memberName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">{leave.memberName}</div>
                        <div className="text-xs text-muted-foreground">
                          {leave.leaveType} • {leave.days} days
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        leave.status === 'approved' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }>
                        {leave.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>


            {/* Quick Actions */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Quick Actions</CardTitle>
                    <p className="text-sm text-muted-foreground">Capacity management</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white/90 backdrop-blur-sm border-white/20"
                  onClick={() => navigate('/manager/team')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Team Members
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white/90 backdrop-blur-sm border-white/20"
                  onClick={() => navigate('/manager/approvals')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Review Leave Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamCapacityPage;
