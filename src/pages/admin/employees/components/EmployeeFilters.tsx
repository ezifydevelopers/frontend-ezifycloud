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
  };
  onFiltersChange: (filters: {
    department: string;
    role: string;
    status: string;
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

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    // Convert empty string to 'all' for proper filtering
    const filterValue = value === '' ? 'all' : value;
    onFiltersChange({
      ...filters,
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
    </div>
  );
};

export default EmployeeFilters;
