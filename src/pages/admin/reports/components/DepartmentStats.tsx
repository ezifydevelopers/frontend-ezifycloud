import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DepartmentStatsProps {
  department: string;
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({ department }) => {
  // Mock data - replace with actual data
  const mockData = [
    { name: 'Engineering', total: 45, onLeave: 8, pending: 3, approved: 12 },
    { name: 'Marketing', total: 23, onLeave: 3, pending: 1, approved: 5 },
    { name: 'HR', total: 12, onLeave: 1, pending: 0, approved: 2 },
    { name: 'Sales', total: 34, onLeave: 6, pending: 2, approved: 8 },
    { name: 'Finance', total: 18, onLeave: 2, pending: 1, approved: 3 },
    { name: 'Operations', total: 24, onLeave: 4, pending: 1, approved: 6 },
  ];

  const filteredData = department === 'all' 
    ? mockData 
    : mockData.filter(dept => dept.name.toLowerCase() === department);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Department Leave Statistics</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.map((dept) => (
          <div key={dept.name} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{dept.name}</h4>
              <Badge variant="outline">{dept.total} employees</Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Currently on Leave</span>
                <span className="font-medium text-blue-600">{dept.onLeave}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending Requests</span>
                <span className="font-medium text-yellow-600">{dept.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Approved This Month</span>
                <span className="font-medium text-green-600">{dept.approved}</span>
              </div>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${(dept.onLeave / dept.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {((dept.onLeave / dept.total) * 100).toFixed(1)}% on leave
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentStats;
