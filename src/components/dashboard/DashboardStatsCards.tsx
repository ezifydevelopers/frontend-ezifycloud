import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react';
import { DashboardData } from '@/components/hoc/withDashboardData';

interface DashboardStatsCardsProps {
  dashboardData: DashboardData;
  className?: string;
}

const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ 
  dashboardData, 
  className = "" 
}) => {
  const {
    totalTeamMembers,
    activeTeamMembers,
    onLeaveToday,
    presentToday,
    pendingApprovals,
    approvedThisMonth,
    rejectedThisMonth,
    totalRequests,
    teamCapacity,
    attendanceRate,
    utilizationRate
  } = dashboardData;

  // Calculate trends (you can enhance this with historical data)
  const getTrendIcon = (value: number, isPositive: boolean) => {
    if (value === 0) return null;
    return isPositive ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendText = (value: number, isPositive: boolean) => {
    if (value === 0) return "No change";
    return isPositive ? `+${value} from last week` : `${value} from last week`;
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
      {/* Team Members Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">Team Members</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{totalTeamMembers}</p>
              <p className="text-xs text-slate-500">Active team members</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">Pending Approvals</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{pendingApprovals}</p>
              <p className="text-xs text-slate-500">Awaiting your review</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
              <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Approved This Month Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">Approved This Month</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{approvedThisMonth}</p>
              <p className="text-xs text-slate-500">Successfully processed</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Capacity Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">Team Capacity</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{attendanceRate}%</p>
              <p className="text-xs text-slate-500">Current availability</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Target className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStatsCards;
