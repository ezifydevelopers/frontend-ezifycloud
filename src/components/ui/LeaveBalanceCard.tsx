import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, Zap } from 'lucide-react';

interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
  emergency: number;
}

interface LeaveBalanceCardProps {
  leaveBalance: LeaveBalance;
  title?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({
  leaveBalance,
  title = "Leave Balance",
  showTitle = true,
  compact = false
}) => {
  const leaveTypes = [
    {
      type: 'annual',
      label: 'Annual Leave',
      value: leaveBalance.annual,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      type: 'sick',
      label: 'Sick Leave',
      value: leaveBalance.sick,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      type: 'casual',
      label: 'Casual Leave',
      value: leaveBalance.casual,
      icon: Clock,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: 'emergency',
      label: 'Emergency Leave',
      value: leaveBalance.emergency,
      icon: Zap,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        {showTitle && (
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        )}
        <div className="grid grid-cols-2 gap-2">
          {leaveTypes.map((leave) => {
            const Icon = leave.icon;
            return (
              <div key={leave.type} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
                <div className={`p-1 rounded-full ${leave.bgColor}`}>
                  <Icon className={`h-3 w-3 ${leave.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">{leave.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{leave.value} days</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {leaveTypes.map((leave) => {
            const Icon = leave.icon;
            return (
              <div key={leave.type} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className={`p-2 rounded-full ${leave.bgColor}`}>
                  <Icon className={`h-4 w-4 ${leave.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">{leave.label}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">{leave.value}</span>
                    <span className="text-sm text-gray-500">days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceCard;
