import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { managerAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LeaveRequestDetails from '@/components/leave/LeaveRequestDetails';
import { LeaveRequest as LeaveRequestType } from '@/types/leave';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  FileText,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Target,
  Award,
  User,
  Building2,
  Clock3,
  CalendarDays,
  AlertTriangle,
  Info,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
  priority: 'low' | 'medium' | 'high';
  emergencyContact?: string;
  workHandover?: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  comments?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface LeaveHistorySummary {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalDays: number;
  approvedDays: number;
  rejectedDays: number;
  pendingDays: number;
  byLeaveType: { [key: string]: number };
  byMonth: { [key: string]: number };
  averageDaysPerRequest: number;
  approvalRate: number;
}

const LeaveHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestType | null>(null);
  const [summary, setSummary] = useState<LeaveHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState<{ [key: string]: { remaining: number; total: number; used: number } }>({});

  // Filters and pagination
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    year: new Date().getFullYear().toString(),
    search: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    try {
      if (!user) return;

      console.log('🔍 ManagerLeaveHistory: Fetching leave balance...');
      
      const response = await managerAPI.getLeaveBalance();
      
      if (response.success && response.data) {
        console.log('✅ ManagerLeaveHistory: Leave balance data:', response.data);
        setLeaveBalance(response.data as { [key: string]: { remaining: number; total: number; used: number } });
      } else {
        console.warn('❌ ManagerLeaveHistory: Failed to fetch leave balance');
        setLeaveBalance({});
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('User not authenticated, skipping API calls');
        setLeaveRequests([]);
        return;
      }

      console.log('🔍 ManagerLeaveHistory: Fetching leave history with filters:', filters);
      
      // Add cache-busting timestamp
      const timestamp = Date.now();
      
      const params: Record<string, unknown> = {
        _t: timestamp,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      };

      // Add filters
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.type !== 'all') {
        params.leaveType = filters.type;
      }
      if (filters.year) {
        params.year = parseInt(filters.year);
      }

      console.log('🔍 ManagerLeaveHistory: API params:', params);

      const response = await managerAPI.getLeaveHistory(params);
      
      console.log('🔍 ManagerLeaveHistory: API response:', response);

      if (response.success && response.data) {
        console.log('✅ ManagerLeaveHistory: Setting leave requests:', response.data);
        setLeaveRequests(response.data as LeaveRequest[]);
        
        // Update pagination if provided
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.totalItems || 0,
            totalPages: response.pagination.totalPages || 0
          }));
        }
        
        // Set summary if provided
        if (response.summary) {
          setSummary(response.summary as LeaveHistorySummary);
        }
      } else {
        console.warn('❌ ManagerLeaveHistory: API failed or returned no data');
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (user !== undefined) {
      fetchLeaveBalance();
    }
  }, [user]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sick': return 'bg-red-100 text-red-800 border-red-200';
      case 'casual': return 'bg-green-100 text-green-800 border-green-200';
      case 'emergency': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'maternity': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'paternity': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'rejected': return <AlertCircle className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        request.leaveType.toLowerCase().includes(searchTerm) ||
        request.reason.toLowerCase().includes(searchTerm) ||
        request.status.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ width: '100%', maxWidth: '1088px', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading leave history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ maxWidth: '1088px' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Leave History</h1>
              <p className="text-slate-600">View and manage your leave request history</p>
            </div>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Filters and Summary */}
          <div className="lg:col-span-1">
            {/* Filters */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Filter className="h-5 w-5 text-blue-600" />
                  </div>
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search requests..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Leave Type</label>
                  <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="maternity">Maternity</SelectItem>
                      <SelectItem value="paternity">Paternity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Year</label>
                  <Select value={filters.year} onValueChange={(value) => handleFilterChange('year', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            {summary && (
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{summary.totalRequests}</p>
                      <p className="text-xs text-blue-600">Total Requests</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{summary.approvedRequests}</p>
                      <p className="text-xs text-green-600">Approved</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{summary.pendingRequests}</p>
                      <p className="text-xs text-yellow-600">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{summary.rejectedRequests}</p>
                      <p className="text-xs text-red-600">Rejected</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">Approval Rate</span>
                      <span className="text-sm font-medium text-slate-900">{summary.approvalRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${summary.approvalRate}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Leave Requests List */}
          <div className="lg:col-span-3">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                      Leave Requests
                    </CardTitle>
                    <CardDescription>
                      {pagination.total} total requests found
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredRequests.length > 0 ? (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="p-6 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={`text-xs ${getLeaveTypeColor(request.leaveType)}`}>
                                {request.leaveType}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1">{request.status}</span>
                              </Badge>
                              <Badge className={`text-xs ${getPriorityColor(request.priority)}`}>
                                {request.priority} priority
                              </Badge>
                              {request.isHalfDay && (
                                <Badge variant="outline" className="text-xs">
                                  Half Day ({request.halfDayPeriod})
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </h3>
                            <p className="text-sm text-slate-600 mb-2">{request.reason}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {request.days} day{request.days !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Submitted {new Date(request.submittedAt).toLocaleDateString()}
                              </span>
                              {request.reviewedAt && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Reviewed {new Date(request.reviewedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // Convert local LeaveRequest to LeaveRequestType format
                                const detailRequest: LeaveRequestType = {
                                  id: request.id,
                                  leaveType: request.leaveType as any,
                                  startDate: request.startDate,
                                  endDate: request.endDate,
                                  totalDays: request.days,
                                  reason: request.reason,
                                  status: request.status,
                                  priority: request.priority || 'medium',
                                  isPaid: true, // Default, can be updated if available
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
                            {request.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {request.comments && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Admin Comments:</strong> {request.comments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                        <div className="text-sm text-slate-600">
                          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-sm text-slate-600">
                            Page {pagination.page} of {pagination.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No leave requests found</h3>
                    <p className="text-slate-600 mb-4">
                      {filters.search || filters.status !== 'all' || filters.type !== 'all' 
                        ? 'Try adjusting your filters to see more results.'
                        : 'You haven\'t submitted any leave requests yet.'
                      }
                    </p>
                    {!filters.search && filters.status === 'all' && filters.type === 'all' && (
                      <Button onClick={() => window.location.href = '/manager/request-leave'}>
                        Submit Leave Request
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
