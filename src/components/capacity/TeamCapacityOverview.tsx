import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Calendar, 
  RefreshCw,
  Filter,
  BarChart3,
  Eye,
  Activity,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { withCapacityData, WithCapacityDataProps, CapacityData } from '@/components/hoc/withCapacityData';
import OfficeCapacityCards from '@/components/capacity/OfficeCapacityCards';
import DepartmentCapacityCard from '@/components/capacity/DepartmentCapacityCard';
import EmployeeStatusOverview from '@/components/capacity/EmployeeStatusOverview';

export interface TeamCapacityOverviewProps {
  // Display options
  variant?: 'full' | 'compact' | 'widget'; // widget = minimal for dashboard, compact = cards only, full = everything
  showStats?: boolean;
  showFilters?: boolean;
  showRefresh?: boolean;
  showDepartmentBreakdown?: boolean;
  showEmployeeList?: boolean;
  maxEmployees?: number;
  className?: string;
  
  // Customization
  title?: string;
  subtitle?: string;
}

const TeamCapacityOverviewComponent: React.FC<TeamCapacityOverviewProps & WithCapacityDataProps> = ({
  capacityData,
  refreshCapacityData,
  isRefreshing,
  variant = 'full',
  showStats = true,
  showFilters = variant !== 'widget',
  showRefresh = variant !== 'widget',
  showDepartmentBreakdown = variant !== 'widget',
  showEmployeeList = variant !== 'widget',
  maxEmployees = 10,
  className = '',
  title,
  subtitle
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleRefresh = async () => {
    await refreshCapacityData();
    toast({
      title: 'Data Refreshed',
      description: 'Team capacity data has been updated.',
    });
  };

  // Filter employees based on selected filters
  const filteredEmployees = capacityData.employees?.filter((employee) => {
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
    return matchesDepartment && matchesStatus;
  }) || [];

  // Widget variant - minimal display for dashboard
  if (variant === 'widget') {
    return (
      <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{title || 'Team Capacity'}</CardTitle>
                <p className="text-sm text-muted-foreground">{subtitle || 'Current team availability'}</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="ghost"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {capacityData.isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading team data...</p>
            </div>
          ) : capacityData.error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600">{capacityData.error}</p>
              <Button onClick={handleRefresh} size="sm" className="mt-2">Retry</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{capacityData.presentToday}</p>
                <p className="text-xs text-muted-foreground">of {capacityData.totalEmployees}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold text-amber-600">{capacityData.onLeaveToday}</p>
                <p className="text-xs text-muted-foreground">{capacityData.attendanceRate}% available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact variant - stats cards only
  if (variant === 'compact') {
    return (
      <div className={`space-y-6 ${className}`}>
        {capacityData.isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Loading capacity data...</p>
          </div>
        ) : capacityData.error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{capacityData.error}</p>
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        ) : (
          <>
            {title && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
              </div>
            )}
            {showStats && (
              <OfficeCapacityCards 
                capacityData={capacityData}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Full variant - everything
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {title && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}

      {capacityData.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Loading team capacity data...</p>
          </div>
        </div>
      ) : capacityData.error ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{capacityData.error}</p>
            {showRefresh && (
              <Button onClick={handleRefresh}>Retry</Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Capacity Stats Cards */}
          {showStats && (
            <OfficeCapacityCards 
              capacityData={capacityData}
              className="mb-8"
            />
          )}

          {/* Filters and Controls */}
          {showFilters && (
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
                        {Array.from(new Set(capacityData.employees?.map(e => e.department) || [])).map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
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
                        disabled={isRefreshing}
                        className="bg-white/50 border-white/20 hover:bg-white/80"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {showDepartmentBreakdown || showEmployeeList ? (
            <div className="space-y-6">
              {/* Employee Status Overview */}
              {showEmployeeList && (
                <div>
                  <EmployeeStatusOverview 
                    capacityData={{
                      ...capacityData,
                      employees: filteredEmployees
                    }}
                    maxDisplay={maxEmployees}
                  />
                </div>
              )}

              {/* Department Breakdown - Full Width Below Employee Status */}
              {showDepartmentBreakdown && (
                <div>
                  <DepartmentCapacityCard 
                    capacityData={capacityData}
                  />
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

// Wrap with HOC for automatic data fetching
const TeamCapacityOverview = withCapacityData(TeamCapacityOverviewComponent, {
  autoFetch: true,
  refreshInterval: 30000, // 30 seconds
  cacheTimeout: 60000, // 1 minute
  includeEmployeeDetails: true
});

export default TeamCapacityOverview;

