import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  FileText,
  Search,
  CalendarDays,
  RefreshCw,
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { APP_CONFIG } from '@/lib/config';
import PageHeader from '@/components/layout/PageHeader';
import LeaveRequestForm from '@/components/forms/LeaveRequestForm';
import { LeaveBalanceCard } from '@/components/hoc/withLeaveBalance';

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

const LeaveManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshAfterLeaveAction } = useDataRefresh();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'request');
  const [loading, setLoading] = useState(false);
  
  // Leave History state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
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

  // Fetch leave history for Leave History tab
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
    if (activeTab === 'history' || activeTab === 'reports') {
      fetchLeaveHistory();
    }
  }, [activeTab, fetchLeaveHistory]);

  // Sync tab with URL parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab && (tabFromUrl === 'request' || tabFromUrl === 'history' || tabFromUrl === 'reports')) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Update URL when tab changes (but avoid updating on initial load)
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'request';
    if (activeTab !== currentTab) {
      const newSearchParams = new URLSearchParams(searchParams);
      if (activeTab === 'request') {
        newSearchParams.delete('tab');
      } else {
        newSearchParams.set('tab', activeTab);
      }
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [activeTab, navigate, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    // Prevent double submission
    if (loading) {
      console.warn('⚠️ LeaveManagement: Submission already in progress, ignoring duplicate request');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 LeaveManagement: Submitting form data:', data);
      
      const response = await employeeAPI.createLeaveRequest(data as any);
      
      if (response.success) {
        toast({
          title: "✅ Leave Request Submitted",
          description: "Your leave request has been sent to your manager for approval.",
          duration: 6000,
        });
        
        await refreshAfterLeaveAction('create');
        setActiveTab('history'); // Switch to history tab after submission
        await fetchLeaveHistory();
      } else {
        const errorMessage = response.message || 'Failed to submit leave request. Please try again.';
        
        // Provide more helpful error messages
        let title = "❌ Leave Request Failed";
        let description = errorMessage;
        
        let variant: 'default' | 'destructive' = 'destructive';
        
        if (errorMessage.includes('already have a leave request')) {
          title = "⚠️ Overlapping Leave Request";
          description = `${errorMessage}\n\nYou already have a pending or approved leave request for this period. Please check your leave history or choose different dates.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Insufficient leave balance')) {
          title = "⚠️ Insufficient Leave Balance";
          description = `${errorMessage}\n\nPlease adjust your leave request to match your available balance.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Policy violation') || errorMessage.includes('Policy violations')) {
          title = "⚠️ Policy Violation";
          // Extract the specific violation message(s) after "Policy violation:" or "Policy violations:"
          const violationDetails = errorMessage.replace(/^Policy violations?:?\s*/i, '').trim();
          description = violationDetails || errorMessage;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('negative balance') || errorMessage.includes('deducted from salary')) {
          title = "💰 Salary Deduction Notice";
          description = `${errorMessage}\n\nYour request will be processed with salary deduction for excess days.`;
          variant = 'default'; // Show as warning, not error
        }
        
        toast({
          title,
          description,
          variant,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      let errorMessage = 'Failed to submit leave request. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        let title = "❌ Error";
        let description = errorMessage;
        let variant: 'default' | 'destructive' = 'destructive';
        
        if (errorMessage.includes('already have a leave request') || errorMessage.includes('overlapping')) {
          title = "⚠️ Overlapping Leave Request";
          description = `${errorMessage}\n\nYou already have a pending or approved leave request for this period. Please check your leave history or choose different dates.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Insufficient leave balance')) {
          title = "⚠️ Insufficient Leave Balance";
          description = `${errorMessage}\n\nPlease adjust your leave request.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Policy violation') || errorMessage.includes('Policy violations')) {
          title = "⚠️ Policy Violation";
          // Extract the specific violation message(s) after "Policy violation:" or "Policy violations:"
          const violationDetails = errorMessage.replace(/^Policy violations?:?\s*/i, '').trim();
          description = violationDetails || errorMessage;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('negative balance') || errorMessage.includes('deducted from salary')) {
          title = "💰 Salary Deduction Notice";
          description = `${errorMessage}\n\nYour request will be processed with salary deduction for excess days.`;
          variant = 'default'; // Show as warning, not error
        }
        
        toast({
          title,
          description,
          variant,
          duration: 8000,
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title="Leave Management"
            subtitle="Request leave and view your leave history in one place"
            icon={Calendar}
            iconColor="from-blue-600 to-purple-600"
          />

          {/* Main Content with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-1 shadow-lg">
              <TabsTrigger 
                value="request" 
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Request Leave
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Clock className="w-4 h-4 mr-2" />
                Leave History
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>

            {/* Request Leave Tab */}
            <TabsContent value="request" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
                {/* Left Column - Leave Balance & Public Holidays */}
                <div className="lg:col-span-1 flex flex-col space-y-6">
                  <LeaveBalanceCard />
                  
                  {/* Public Holidays Card */}
                  <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
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
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
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

                {/* Right Column - Leave Request Form */}
                <div className="lg:col-span-2 flex flex-col">
                  <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        Submit Leave Request
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Fill out the form below to submit your leave request. Your manager will be notified for approval.
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col overflow-auto">
                      <LeaveRequestForm 
                        onSubmit={handleFormSubmit}
                        className="flex-1"
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Leave History Tab */}
            <TabsContent value="history" className="space-y-6">
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
                              className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
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
                                  <p className="text-sm text-muted-foreground mb-2">{request.reason}</p>
                                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{request.days} {request.days === 1 ? 'day' : 'days'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <CalendarDays className="h-4 w-4" />
                                      <span>Submitted {new Date(request.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
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
                                  {holiday.description && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                      {holiday.description as string}
                                    </p>
                                  )}
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
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
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
                              {leaveRequests.length}
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
                              {leaveRequests.filter(r => r.status === 'approved').length}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {leaveRequests.length > 0 
                                ? Math.round((leaveRequests.filter(r => r.status === 'approved').length / leaveRequests.length) * 100)
                                : 0}% approval rate
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
                              {leaveRequests.filter(r => r.status === 'pending').length}
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
                              {leaveRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days, 0)}
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
                                    width: `${leaveRequests.length > 0 ? (typeRequests.length / leaveRequests.length) * 100 : 0}%` 
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
                                  {holiday.description && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                      {holiday.description as string}
                                    </p>
                                  )}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagementPage;

