import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

interface LeaveBalanceData {
  [key: string]: {
    total: number;
    used: number;
    remaining: number;
  };
}

interface LeaveBalanceOverviewCardProps {
  leaveBalance: LeaveBalanceData;
  title?: string;
  description?: string;
  showProgress?: boolean;
  showEmptyState?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}

const LeaveBalanceOverviewCard: React.FC<LeaveBalanceOverviewCardProps> = ({
  leaveBalance,
  title = "Leave Balance Overview",
  description = "Track your remaining leave days across different categories",
  showProgress = true,
  showEmptyState = true,
  emptyStateTitle = "No Leave Policies",
  emptyStateDescription = "No leave policies are currently available.",
  className = ""
}) => {
  // Get color for leave type
  const getLeaveTypeColor = (leaveType: string) => {
    // Dynamic color assignment based on leave type
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-red-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-purple-500 to-violet-500',
      'from-indigo-500 to-blue-500',
      'from-pink-500 to-rose-500',
      'from-teal-500 to-cyan-500'
    ];
    
    // Use hash of type name to get consistent color
    let hash = 0;
    for (let i = 0; i < leaveType.length; i++) {
      hash = ((hash << 5) - hash + leaveType.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get progress bar color based on usage percentage
  const getProgressColor = (percent: number) => {
    if (percent >= 70) return 'bg-green-500';
    if (percent >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Format leave type name for display
  const formatLeaveTypeName = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
      <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            {title}
          </CardTitle>
          <p className="text-slate-600 text-sm mt-2">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(leaveBalance).length > 0 ? (
            Object.entries(leaveBalance).map(([type, balance], index) => {
              const percentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
              const progressColor = getProgressColor(percentage);
              const typeColor = getLeaveTypeColor(type);

              return (
                <div
                  key={type}
                  className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${typeColor}`}></div>
                      <span className="font-semibold text-slate-700 capitalize">
                        {formatLeaveTypeName(type)} Leave
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      {balance.used.toFixed(1)} / {balance.total} days
                    </span>
                  </div>
                  
                  {showProgress && (
                    <Progress 
                      value={percentage} 
                      className="h-2 mb-2"
                    />
                  )}
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">
                      Used: <span className="font-medium text-slate-700">{balance.used.toFixed(1)}</span>
                    </span>
                    <span className="text-slate-500">
                      Remaining: <span className="font-medium text-slate-700">{balance.remaining.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            showEmptyState && (
              <div className="text-center py-8">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">{emptyStateTitle}</h3>
                <p className="text-slate-500">{emptyStateDescription}</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveBalanceOverviewCard;
