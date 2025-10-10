import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const LeaveBalanceReport: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveBalanceData();
  }, []);

  const fetchLeaveBalanceData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when backend is ready
      // const response = await adminAPI.getLeaveBalanceReport();
      // if (response.success && response.data) {
      //   setData(response.data);
      // } else {
      //   setData([]);
      // }
      setData([]);
    } catch (error) {
      console.error('Error fetching leave balance data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Employee Leave Balances</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Employee Leave Balances</h3>
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No leave balance data available</p>
          <p className="text-sm">Data will appear when employees are added to the system</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((employee, index) => (
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
      )}
    </div>
  );
};

export default LeaveBalanceReport;
