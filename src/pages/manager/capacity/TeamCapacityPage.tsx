import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Activity,
  CalendarDays,
  CheckCircle,
  Zap,
  Users,
  RefreshCw,
  Target,
} from 'lucide-react';
import { managerAPI } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import TeamCapacityOverview from '@/components/capacity/TeamCapacityOverview';
import OfficeCapacityCards from '@/components/capacity/OfficeCapacityCards';
import { withCapacityData, WithCapacityDataProps } from '@/components/hoc/withCapacityData';

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

const TeamCapacityPageComponent: React.FC<WithCapacityDataProps> = ({
  capacityData,
  refreshCapacityData,
  isRefreshing: isCapacityRefreshing
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingLeaves, setUpcomingLeaves] = useState<UpcomingLeave[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch upcoming leaves and departments for sidebar
  const fetchUpcomingLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const [departmentsResponse, leavesResponse] = await Promise.all([
        managerAPI.getTeamDepartments(),
        managerAPI.getUpcomingLeaves(10),
      ]);

      if (departmentsResponse.success && departmentsResponse.data) {
        setDepartments(departmentsResponse.data as string[]);
      } else {
        setDepartments([]);
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
      } else {
        setUpcomingLeaves([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming leaves:', error);
      setUpcomingLeaves([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingLeaves();
  }, [fetchUpcomingLeaves]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchUpcomingLeaves(),
      refreshCapacityData()
    ]);
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title="Team Capacity"
            subtitle="View team capacity, availability, and workload management"
            icon={Target}
            iconColor="from-green-500 to-emerald-600"
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

          {/* Stats Cards - Full Width at Top */}
          {capacityData.isLoading ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                        <div className="h-8 bg-slate-200 rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-slate-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="h-12 w-12 bg-slate-200 rounded-xl animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : capacityData.error ? (
            <div className="w-full mb-6">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <p className="text-sm text-red-600">{capacityData.error}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full">
              <OfficeCapacityCards 
                capacityData={capacityData}
                className="mb-6"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Capacity Overview - Full Width Below Stats */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <Card className="relative bg-white/90 backdrop-blur-sm border-white/20 shadow-xl rounded-3xl">
                  <CardContent className="p-6">
                    <TeamCapacityOverview
                      variant="full"
                      showStats={false}
                      showFilters={true}
                      showRefresh={false}
                      showDepartmentBreakdown={true}
                      showEmployeeList={true}
                      maxEmployees={20}
                      title="Team Capacity"
                      subtitle="Current availability and status of your team"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Leaves */}
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    Upcoming Leaves
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Scheduled time off</p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading leaves...</p>
                    </div>
                  ) : upcomingLeaves.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {upcomingLeaves.slice(0, 5).map((leave) => (
                        <div 
                          key={leave.id} 
                          className="p-3 rounded-lg border border-slate-200/50 bg-gradient-to-r from-slate-50 to-amber-50/30 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                                <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm">
                                  {leave.memberName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">{leave.memberName}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                  {leave.leaveType} • {leave.days} {leave.days === 1 ? 'day' : 'days'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                leave.status === 'approved' 
                                  ? 'bg-green-100 text-green-700 border-green-200' 
                                  : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              }`}
                            >
                              {leave.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CalendarDays className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No upcoming leaves</p>
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Quick Actions */}
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    Quick Actions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Capacity management</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-slate-200 hover:bg-slate-50"
                    onClick={() => navigate('/manager/team')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Team Members
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-slate-200 hover:bg-slate-50"
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
    </div>
  );
};

// Wrap with HOC for automatic data fetching
const TeamCapacityPage = withCapacityData(TeamCapacityPageComponent, {
  autoFetch: true,
  refreshInterval: 30000, // 30 seconds
  cacheTimeout: 60000, // 1 minute
  includeEmployeeDetails: true
});

export default TeamCapacityPage;
