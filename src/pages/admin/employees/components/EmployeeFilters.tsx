import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmployeeFiltersProps {
  filters: {
    department: string;
    role: string;
    status: string;
    probationStatus: string;
    employeeType: string;
    region: string;
  };
  onFiltersChange: (filters: {
    department: string;
    role: string;
    status: string;
    probationStatus: string;
    employeeType: string;
    region: string;
  }) => void;
}

const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const departments = [
    'Engineering',
    'Human Resources',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Customer Support',
    'IT',
  ];

  const roles = ['admin', 'manager', 'employee'];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const probationStatusOptions = [
    { value: 'all', label: 'All Probation Status' },
    { value: 'active', label: 'In Probation' },
    { value: 'completed', label: 'Probation Completed' },
    { value: 'extended', label: 'Probation Extended' },
    { value: 'terminated', label: 'Probation Terminated' },
  ];

  const employeeTypeOptions = [
    { value: 'all', label: 'All Employee Types' },
    { value: 'onshore', label: 'Onshore' },
    { value: 'offshore', label: 'Offshore' },
  ];

  const commonRegions = [
    'USA',
    'India',
    'UK',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Singapore',
    'Japan',
    'UAE',
    'Philippines',
    'Brazil',
    'Mexico',
  ];

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    // Convert empty string to 'all' for proper filtering
    const filterValue = value === '' ? 'all' : value;
    onFiltersChange({
      department: filters.department,
      role: filters.role,
      status: filters.status,
      probationStatus: filters.probationStatus || 'all',
      employeeType: filters.employeeType || 'all',
      region: filters.region || 'all',
      [key]: filterValue,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 min-w-0">
        <Label htmlFor="department-filter" className="text-sm font-medium text-slate-700 block mb-2">Department</Label>
        <Select
          value={filters.department || 'all'}
          onValueChange={(value) => handleFilterChange('department', value)}
        >
          <SelectTrigger 
            id="department-filter" 
            className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full"
          >
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-0">
        <Label htmlFor="role-filter" className="text-sm font-medium text-slate-700 block mb-2">Role</Label>
        <Select
          value={filters.role || 'all'}
          onValueChange={(value) => handleFilterChange('role', value)}
        >
          <SelectTrigger 
            id="role-filter" 
            className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full"
          >
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-0">
        <Label htmlFor="status-filter" className="text-sm font-medium text-slate-700 block mb-2">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger 
            id="status-filter" 
            className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full"
          >
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-0">
        <Label htmlFor="probation-status-filter" className="text-sm font-medium text-slate-700 block mb-2">Probation Status</Label>
        <Select
          value={filters.probationStatus || 'all'}
          onValueChange={(value) => handleFilterChange('probationStatus', value)}
        >
          <SelectTrigger 
            id="probation-status-filter" 
            className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full"
          >
            <SelectValue placeholder="All Probation Status" />
          </SelectTrigger>
          <SelectContent>
            {probationStatusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-0">
        <Label htmlFor="employee-type-filter" className="text-sm font-medium text-slate-700 block mb-2">Employee Type</Label>
        <Select
          value={filters.employeeType || 'all'}
          onValueChange={(value) => handleFilterChange('employeeType', value)}
        >
          <SelectTrigger 
            id="employee-type-filter" 
            className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full"
          >
            <SelectValue placeholder="All Employee Types" />
          </SelectTrigger>
          <SelectContent>
            {employeeTypeOptions.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-0">
        <Label htmlFor="region-filter" className="text-sm font-medium text-slate-700 block mb-2">Region</Label>
        <Select
          value={filters.region || 'all'}
          onValueChange={(value) => handleFilterChange('region', value)}
        >
          <SelectTrigger 
            id="region-filter" 
            className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full"
          >
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {commonRegions.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default EmployeeFilters;
