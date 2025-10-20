import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  MapPin,
  Activity,
  Eye
} from 'lucide-react';
import { CapacityData } from '@/components/hoc/withCapacityData';

interface EmployeeStatusOverviewProps {
  capacityData: CapacityData;
  className?: string;
  maxDisplay?: number;
}

const EmployeeStatusOverview: React.FC<EmployeeStatusOverviewProps> = ({ 
  capacityData, 
  className = "",
  maxDisplay = 10
}) => {
  const { employees } = capacityData;

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

  const displayedEmployees = employees.slice(0, maxDisplay);
  const hasMore = employees.length > maxDisplay;

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Employee Status</CardTitle>
              <p className="text-sm text-muted-foreground">Current office presence</p>
            </div>
          </div>
          {hasMore && (
            <Badge variant="outline" className="text-xs">
              +{employees.length - maxDisplay} more
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedEmployees.length > 0 ? (
            displayedEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {employee.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-slate-900">{employee.name}</p>
                    <p className="text-sm text-slate-500">{employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(employee.status)}
                  >
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(employee.status)}
                      <span>{getStatusText(employee.status)}</span>
                    </div>
                  </Badge>
                  <div className="text-xs text-slate-400">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {formatLastActive(employee.lastActive)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">No employee data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeStatusOverview;
