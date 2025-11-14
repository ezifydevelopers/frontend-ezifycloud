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
import { adminAPI } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { withCapacityData, WithCapacityDataProps } from '@/components/hoc/withCapacityData';
import OfficeCapacityCards from '@/components/capacity/OfficeCapacityCards';
import DepartmentCapacityCard from '@/components/capacity/DepartmentCapacityCard';

interface AdminCapacityPageProps extends WithCapacityDataProps {}

const AdminCapacityPage: React.FC<AdminCapacityPageProps> = ({ 
  capacityData, 
  refreshCapacityData, 
  isRefreshing 
}) => {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleRefresh = async () => {
    await refreshCapacityData();
    toast({
      title: 'Data Refreshed',
      description: 'Office capacity data has been updated.',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'on-leave':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'remote':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'offline':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'on-leave':
        return <Calendar className="h-4 w-4 text-amber-600" />;
      case 'remote':
        return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'offline':
        return <UserX className="h-4 w-4 text-gray-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'on-leave':
        return 'On Leave';
      case 'remote':
        return 'Remote';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const formatLastActive = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Filter employees based on selected filters
  const filteredEmployees = capacityData.employees.filter(employee => {
    const departmentMatch = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const statusMatch = selectedStatus === 'all' || employee.status === selectedStatus;
    return departmentMatch && statusMatch;
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(capacityData.employees.map(emp => emp.department)));

  if (capacityData.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading office capacity data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (capacityData.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{capacityData.error}</p>
              <Button onClick={refreshCapacityData}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader
          title="Office Capacity"
          subtitle="Real-time attendance and presence overview for the entire organization"
          icon={Building2}
          iconColor="from-blue-600 to-purple-600"
        >
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="bg-white/50 border-white/20 hover:bg-white/80"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </PageHeader>

        {/* Capacity Overview Cards */}
        <OfficeCapacityCards 
          capacityData={capacityData}
          className="mb-8"
        />

        {/* Filters and Controls - Moved to top */}
        <div className="mb-6">
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Filters:</span>
                  </div>
                  
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">
                    Showing {filteredEmployees.length} of {capacityData.employees.length} employees
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Department Breakdown */}
          <div className="lg:col-span-1">
            <DepartmentCapacityCard 
              capacityData={capacityData}
            />
          </div>

          {/* Employee Status Overview - Consolidated View */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">All Employees</CardTitle>
                      <p className="text-sm text-muted-foreground">Complete employee status overview</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {capacityData.presentToday} present
                    </Badge>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {capacityData.onLeaveToday} on leave
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                              {employee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">{employee.name}</p>
                            <p className="text-sm text-slate-600">{employee.department} • {employee.position}</p>
                            <p className="text-xs text-slate-500">{employee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(employee.status)}
                          >
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(employee.status)}
                              <span>{getStatusText(employee.status)}</span>
                            </div>
                          </Badge>
                          <div className="text-xs text-slate-400 text-right">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatLastActive(employee.lastActive)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No employees found matching the selected filters</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap the component with the capacity data HOC
const AdminCapacityPageWithData = withCapacityData(AdminCapacityPage, {
  autoFetch: true,
  refreshInterval: 30000, // 30 seconds
  cacheTimeout: 60000, // 1 minute
  includeEmployeeDetails: true
});

export default AdminCapacityPageWithData;
