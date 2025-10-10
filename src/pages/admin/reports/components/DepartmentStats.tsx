import React from 'react';
import { Badge } from '@/components/ui/badge';

interface DepartmentStatsProps {
  department: string;
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({ department }) => {
  // TODO: Replace with actual data from API
  const data = [];

  const filteredData = department === 'all' 
    ? data 
    : data.filter(dept => dept.name.toLowerCase() === department);

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
