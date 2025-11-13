import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  CalendarDays,
  RefreshCw,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock as ClockIcon } from 'lucide-react';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  isHalfDay?: boolean;
  halfDayPeriod?: string;
  isPaid?: boolean;
}

const LeaveReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Public Holidays state
  const [upcomingHolidays, setUpcomingHolidays] = useState<Record<string, unknown>[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);

  const getLeaveTypeDisplayName = (dbValue: string): string => {
    if (!dbValue) return 'Leave';
    
    // Replace underscores with spaces and capitalize each word
    const formatted = dbValue
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    const typeMap: { [key: string]: string } = {
      'annual': 'Annual Leave',
      'sick': 'Sick Leave',
      'casual': 'Casual Leave',
      'maternity': 'Maternity Leave',
      'paternity': 'Paternity Leave',
      'emergency': 'Emergency Leave'
    };
    
    const lowerValue = dbValue.toLowerCase();
    if (typeMap[lowerValue]) {
      return typeMap[lowerValue];
    }
    
    return formatted;
  };

  // Fetch public holidays
  const fetchUpcomingHolidays = useCallback(async () => {
    try {
      setHolidaysLoading(true);
      const response = await employeeAPI.getUpcomingHolidays(10);
      if (response.success && response.data) {
        setUpcomingHolidays(response.data as unknown as Record<string, unknown>[]);
      } else {
        setUpcomingHolidays([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming holidays:', error);
      setUpcomingHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  }, []);

  // Fetch leave history for reports
  const fetchLeaveHistory = useCallback(async () => {
    try {
      setReportsLoading(true);
      const timestamp = Date.now();
      
      const params: Record<string, unknown> = {
        _t: timestamp,
        limit: 1000,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
        year: parseInt(year)
      };

      const response = await employeeAPI.getLeaveHistory(params);
      
      if (response.success && response.data) {
        const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
        setLeaveRequests(requests as LeaveRequest[]);
      } else {
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave history for reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
      setLeaveRequests([]);
    } finally {
      setReportsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchUpcomingHolidays();
  }, [fetchUpcomingHolidays]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  // Calculate statistics
  const totalRequests = leaveRequests.length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
  const pendingRequests = leaveRequests.filter(r => r.status === 'pending').length;
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;
  const daysUsed = leaveRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days, 0);
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ width: '100%', maxWidth: '1088px', boxSizing: 'border-box' }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Leave Reports
                      </h1>
                    </div>
                  </div>
                  <p className="text-slate-600 text-base lg:text-lg">
                    View comprehensive reports and statistics about your leave requests
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm w-24 bg-white/50"
                    placeholder="Year"
                  />
                  <Button
                    onClick={fetchLeaveHistory}
                    variant="outline"
                    size="sm"
                    disabled={reportsLoading}
                    className="bg-white/50 border-white/20 hover:bg-white/80"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${reportsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/employee/dashboard')}
                    className="bg-white/50 border-white/20 hover:bg-white/80"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - Reports */}
            <div className="lg:col-span-3 space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Requests</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {totalRequests}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">All time</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Approved</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {approvedRequests}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {approvalRate}% approval rate
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Pending</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">
                          {pendingRequests}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
                      </div>
                      <div className="p-3 bg-amber-100 rounded-xl">
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Days Used</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">
                          {daysUsed}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">This year</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leave Type Breakdown */}
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    Leave Type Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Loading report data...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {['annual', 'sick', 'casual', 'emergency'].map((type) => {
                        const typeRequests = leaveRequests.filter(r => r.leaveType === type);
                        const approvedTypeRequests = typeRequests.filter(r => r.status === 'approved');
                        const totalDays = approvedTypeRequests.reduce((sum, r) => sum + r.days, 0);
                        
                        return (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">
                                {getLeaveTypeDisplayName(type)}
                              </span>
                              <span className="text-sm text-slate-600">
                                {typeRequests.length} requests • {totalDays} days used
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${totalRequests > 0 ? (typeRequests.length / totalRequests) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {totalRequests === 0 && (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-500">No data available for {year}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Public Holidays */}
            <div className="lg:col-span-1">
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl sticky top-6">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    Public Holidays
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {holidaysLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading holidays...</p>
                    </div>
                  ) : upcomingHolidays.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {upcomingHolidays.map((holiday: Record<string, unknown>) => (
                        <div 
                          key={holiday.id as string || Math.random().toString()} 
                          className="p-3 rounded-lg border border-slate-200/50 bg-gradient-to-r from-slate-50 to-emerald-50/30 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">{holiday.name as string || 'Holiday'}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                {holiday.type as string || 'Public'} Holiday
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-slate-800 text-sm">
                                {new Date(holiday.date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(holiday.date as string).toLocaleDateString('en-US', { weekday: 'short' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CalendarDays className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No upcoming holidays</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveReportsPage;

