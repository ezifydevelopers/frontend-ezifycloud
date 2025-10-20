import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { CapacityData } from '@/components/hoc/withCapacityData';

interface DepartmentCapacityCardProps {
  capacityData: CapacityData;
  className?: string;
}

const DepartmentCapacityCard: React.FC<DepartmentCapacityCardProps> = ({ 
  capacityData, 
  className = "" 
}) => {
  const { departments } = capacityData;

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getAttendanceIcon = (rate: number) => {
    if (rate >= 90) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate >= 70) return <Users className="h-4 w-4 text-amber-600" />;
    return <Users className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl ${className}`}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Department Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Attendance by department</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments.length > 0 ? (
            departments.map((dept, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getAttendanceIcon(dept.attendanceRate)}
                    <span className="font-medium text-slate-700">{dept.name}</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getAttendanceColor(dept.attendanceRate)}
                  >
                    {dept.attendanceRate}%
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Present: {dept.presentToday}</span>
                    <span>On Leave: {dept.onLeaveToday}</span>
                    <span>Total: {dept.totalEmployees}</span>
                  </div>
                  <Progress 
                    value={dept.attendanceRate} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">No department data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DepartmentCapacityCard;
