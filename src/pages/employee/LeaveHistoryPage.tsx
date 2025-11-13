import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import LeaveRequestDetails from '@/components/leave/LeaveRequestDetails';
import { LeaveRequest as LeaveRequestType } from '@/types/leave';
import { 
  Clock,
  Search,
  CalendarDays,
  RefreshCw,
  Calendar,
  ArrowLeft,
  Eye,
  Clock as ClockIcon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

const LeaveHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    year: new Date().getFullYear().toString(),
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

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

  // Fetch leave history
  const fetchLeaveHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const timestamp = Date.now();
      
      const params: Record<string, unknown> = {
        _t: timestamp,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      };

      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.type !== 'all') {
        params.leaveType = filters.type;
      }
      if (filters.year) {
        params.year = parseInt(filters.year);
      }

      const response = await employeeAPI.getLeaveHistory(params);
      
      if (response.success && response.data) {
        const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
        setLeaveRequests(requests as LeaveRequest[]);
        
        if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
          const paginationData = (response.data as Record<string, unknown>).pagination as Record<string, unknown>;
          setPagination(prev => ({
            ...prev,
            total: paginationData.total as number,
            totalPages: paginationData.totalPages as number
          }));
        }
      } else {
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave history',
        variant: 'destructive',
      });
      setLeaveRequests([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUpcomingHolidays();
  }, [fetchUpcomingHolidays]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || request.status === filters.status;
    const matchesType = filters.type === 'all' || request.leaveType === filters.type;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Leave History
                      </h1>
                    </div>
                  </div>
                  <p className="text-slate-600 text-base lg:text-lg">
                    View your leave request history and track your leave balance
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/employee/dashboard')}
                  className="bg-white/50 border-white/20 hover:bg-white/80"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - History List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filters and Search */}
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search by leave type or reason..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/50 border-white/20 focus:bg-white/80"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="w-32 bg-white/50 border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="w-40 bg-white/50 border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="annual">Annual Leave</SelectItem>
                          <SelectItem value="sick">Sick Leave</SelectItem>
                          <SelectItem value="casual">Casual Leave</SelectItem>
                          <SelectItem value="emergency">Emergency Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={fetchLeaveHistory}
                        variant="outline"
                        size="sm"
                        disabled={historyLoading}
                        className="bg-white/50 border-white/20"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave History List */}
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Leave History</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Loading leave history...</p>
                    </div>
                  ) : filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                      {filteredRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200/50 hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => {
                            // Navigate to request detail if needed
                            console.log('View request:', request.id);
                          }}
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                                {user?.name?.charAt(0) || 'E'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="font-semibold text-slate-900">{getLeaveTypeDisplayName(request.leaveType)}</h3>
                                <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)}`}>
                                  {request.status}
                                </Badge>
                                {request.isPaid !== undefined && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      request.isPaid 
                                        ? "bg-green-50 text-green-700 border-green-200" 
                                        : "bg-orange-50 text-orange-700 border-orange-200"
                                    }`}
                                  >
                                    {request.isPaid ? 'Paid' : 'Unpaid'}
                                  </Badge>
                                )}
                                {request.isHalfDay && (
                                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                    Half Day
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{request.reason}</p>
                              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>Total leave duration: {request.days} {request.days === 1 ? 'day' : 'days'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <CalendarDays className="h-4 w-4" />
                                  <span>Submitted {new Date(request.submittedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Convert local LeaveRequest to LeaveRequestType format
                              const detailRequest: LeaveRequestType = {
                                id: request.id,
                                leaveType: request.leaveType as any,
                                startDate: request.startDate,
                                endDate: request.endDate,
                                totalDays: request.days,
                                reason: request.reason,
                                status: request.status,
                                priority: 'medium',
                                isPaid: request.isPaid ?? true,
                                isHalfDay: request.isHalfDay || false,
                                halfDayPeriod: request.halfDayPeriod as any,
                                submittedAt: request.submittedAt,
                                employee: {
                                  id: user?.id || '',
                                  name: user?.name || 'Unknown',
                                  email: user?.email || '',
                                  department: user?.department || 'Unassigned',
                                  avatar: user?.profilePicture || undefined
                                }
                              };
                              setSelectedRequest(detailRequest);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No leave requests found</p>
                      <p className="text-sm text-slate-500 mt-2">
                        {searchTerm || filters.status !== 'all' || filters.type !== 'all'
                          ? 'Try adjusting your filters'
                          : 'You haven\'t submitted any leave requests yet'}
                      </p>
                      {!searchTerm && filters.status === 'all' && filters.type === 'all' && (
                        <Button
                          onClick={() => navigate('/employee/request-leave')}
                          className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Request Leave
                        </Button>
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
      
      {/* Leave Request Details Modal */}
      {selectedRequest && (
        <LeaveRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          canApprove={false}
        />
      )}
    </div>
  );
};

export default LeaveHistoryPage;

