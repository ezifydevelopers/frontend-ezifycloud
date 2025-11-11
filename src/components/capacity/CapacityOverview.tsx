import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import OfficeCapacityCards from '@/components/capacity/OfficeCapacityCards';
import DepartmentCapacityCard from '@/components/capacity/DepartmentCapacityCard';
import EmployeeStatusOverview from '@/components/capacity/EmployeeStatusOverview';

export interface CapacityOverviewProps {
  capacityData: any;
  showStats?: boolean;
  showFilters?: boolean;
  showRefresh?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const CapacityOverview: React.FC<CapacityOverviewProps> = ({
  capacityData,
  showStats = true,
  showFilters = true,
  showRefresh = true,
  onRefresh,
  className = ''
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
      toast({
        title: 'Data Refreshed',
        description: 'Office capacity data has been updated.',
      });
    }
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
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!capacityData || capacityData.loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Loading capacity data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (capacityData.error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{capacityData.error}</p>
            {showRefresh && (
              <Button onClick={handleRefresh}>Retry</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredEmployees = capacityData.employees?.filter((employee: any) => {
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
    return matchesDepartment && matchesStatus;
  }) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Capacity Overview Cards */}
      {showStats && (
        <OfficeCapacityCards 
          capacityData={capacityData}
          className="mb-8"
        />
      )}

      {/* Filters and Controls */}
      {showFilters && (
        <div className="mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Filters:</span>
                  </div>
                  
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {showRefresh && (
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      size="sm"
                      className="bg-white/50 border-white/20 hover:bg-white/80"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Status List */}
      {viewMode === 'list' && (
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Status ({filteredEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee: any) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/20 hover:bg-white/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900">{employee.name}</p>
                        <p className="text-sm text-slate-500">{employee.department}</p>
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
                <div className="text-center py-12 col-span-full">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No employees found matching the selected filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Department Breakdown */}
          <div className="lg:col-span-1">
            <DepartmentCapacityCard 
              capacityData={capacityData}
            />
          </div>

          {/* Employee Status Overview */}
          <div className="lg:col-span-2">
            <EmployeeStatusOverview 
              capacityData={capacityData}
              maxDisplay={20}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CapacityOverview;
