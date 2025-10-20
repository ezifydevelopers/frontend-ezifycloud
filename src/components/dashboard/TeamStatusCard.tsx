import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, Users, Calendar, CheckCircle } from 'lucide-react';
import { DashboardData } from '@/components/hoc/withDashboardData';

interface TeamStatusCardProps {
  dashboardData: DashboardData;
  className?: string;
}

const TeamStatusCard: React.FC<TeamStatusCardProps> = ({ 
  dashboardData, 
  className = "" 
}) => {
  const {
    totalTeamMembers,
    activeTeamMembers,
    onLeaveToday,
    presentToday,
    attendanceRate
  } = dashboardData;

  // Calculate working members (present but not necessarily active)
  const workingMembers = presentToday;
  const availableMembers = activeTeamMembers - onLeaveToday;

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl ${className}`}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Team Status</CardTitle>
            <p className="text-sm text-muted-foreground">Current team availability</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Availability Progress */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Available</span>
            <span className="text-lg font-bold text-green-600">
              {attendanceRate}%
            </span>
          </div>
          <Progress 
            value={attendanceRate} 
            className="h-2" 
          />
          
          {/* Team Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Present Today</span>
              <span className="font-medium text-green-600">
                {presentToday} members
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">On Leave</span>
              <span className="font-medium text-amber-600">
                {onLeaveToday} members
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Working</span>
              <span className="font-medium text-blue-600">
                {workingMembers} members
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total Team</span>
              <span className="font-medium text-slate-700">
                {totalTeamMembers} members
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamStatusCard;
