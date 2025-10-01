import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const LeaveBalanceReport: React.FC = () => {
  // Mock data - replace with actual data
  const mockData = [
    {
      name: 'John Doe',
      department: 'Engineering',
      annual: { total: 25, used: 8, remaining: 17 },
      sick: { total: 10, used: 2, remaining: 8 },
      casual: { total: 8, used: 3, remaining: 5 },
    },
    {
      name: 'Jane Smith',
      department: 'Marketing',
      annual: { total: 25, used: 15, remaining: 10 },
      sick: { total: 10, used: 1, remaining: 9 },
      casual: { total: 8, used: 5, remaining: 3 },
    },
    {
      name: 'Mike Johnson',
      department: 'HR',
      annual: { total: 25, used: 5, remaining: 20 },
      sick: { total: 10, used: 0, remaining: 10 },
      casual: { total: 8, used: 2, remaining: 6 },
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Employee Leave Balances</h3>
      <div className="space-y-4">
        {mockData.map((employee, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{employee.name}</h4>
                <p className="text-sm text-muted-foreground">{employee.department}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Annual Leave</span>
                  <span className="font-medium">
                    {employee.annual.remaining}/{employee.annual.total}
                  </span>
                </div>
                <Progress 
                  value={(employee.annual.used / employee.annual.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {employee.annual.used} days used
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sick Leave</span>
                  <span className="font-medium">
                    {employee.sick.remaining}/{employee.sick.total}
                  </span>
                </div>
                <Progress 
                  value={(employee.sick.used / employee.sick.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {employee.sick.used} days used
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Casual Leave</span>
                  <span className="font-medium">
                    {employee.casual.remaining}/{employee.casual.total}
                  </span>
                </div>
                <Progress 
                  value={(employee.casual.used / employee.casual.total) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {employee.casual.used} days used
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveBalanceReport;
