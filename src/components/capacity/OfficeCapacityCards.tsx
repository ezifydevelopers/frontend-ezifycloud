import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  Building2,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin
} from 'lucide-react';
import { CapacityData } from '@/components/hoc/withCapacityData';

interface OfficeCapacityCardsProps {
  capacityData: CapacityData;
  className?: string;
}

const OfficeCapacityCards: React.FC<OfficeCapacityCardsProps> = ({ 
  capacityData, 
  className = "" 
}) => {
  const {
    totalEmployees,
    presentToday,
    absentToday,
    onLeaveToday,
    workingRemotely,
    attendanceRate,
    capacityUtilization,
    officeOccupancy
  } = capacityData;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
      {/* Total Employees Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">Total Employees</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{totalEmployees}</p>
              <p className="text-xs text-slate-500">Office workforce</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Present Today Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">Present Today</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{presentToday}</p>
              <p className="text-xs text-slate-500">Currently at office</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <UserCheck className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* On Leave Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">On Leave</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{onLeaveToday}</p>
              <p className="text-xs text-slate-500">Approved leave</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
              <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Rate Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="space-y-1 lg:space-y-2">
              <p className="text-sm font-medium text-slate-600">Attendance Rate</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">{attendanceRate}%</p>
              <p className="text-xs text-slate-500">Office presence</p>
            </div>
            <div className="p-2 lg:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Activity className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficeCapacityCards;
