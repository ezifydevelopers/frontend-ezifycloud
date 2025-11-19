import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import PageHeader from '@/components/layout/PageHeader';
import LeaveBalanceOverviewCard from '@/components/ui/LeaveBalanceOverviewCard';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Calendar,
  User,
  Users,
  Building2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  AlertCircle,
  Star,
  Zap,
  CalendarDays,
  Clock3,
  Download,
  RefreshCw,
  MoreHorizontal,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  BarChart3,
  Target,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { managerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalStats } from '@/types/api';
import LeaveBalanceModal from '@/components/admin/LeaveBalanceModal';
import { useDataRefresh } from '@/hooks/useDataRefresh';

interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    avatar?: string;
    employeeId?: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  priority: 'low' | 'medium' | 'high';
  emergencyContact?: string;
  workHandover?: string;
}

const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { refreshAfterLeaveAction } = useDataRefresh();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    priority: 'all',
  });
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [individualRequest, setIndividualRequest] = useState<LeaveRequest | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, unknown>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string} | null>(null);


  useEffect(() => {
    if (id) {
      fetchIndividualApproval(id);
    } else {
      fetchApprovals();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for filter changes and refresh data
  useEffect(() => {
    if (!id) {
      fetchApprovals();
    }
  }, [filters, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      console.log('🔍 ApprovalsPage: Fetching approvals with filters:', filters);
      
      const requestParams = {
        status: filters.status as 'pending' | 'approved' | 'rejected' | 'all',
        limit: 50,
      };
      
      console.log('🔍 ApprovalsPage: Request parameters:', requestParams);
      
      // Debug URLSearchParams conversion
      const urlParams = new URLSearchParams({
        status: requestParams.status,
        limit: requestParams.limit.toString()
      });
      console.log('🔍 ApprovalsPage: URLSearchParams:', urlParams.toString());
      
      const response = await managerAPI.getLeaveApprovals(requestParams);

      console.log('🔍 ApprovalsPage: API response:', response);

      if (response.success && response.data) {
        const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
        setLeaveRequests(requests as LeaveRequest[]);
        console.log('🔍 ApprovalsPage: Loaded leave requests:', requests.length, requests);
      } else {
        console.log('❌ ApprovalsPage: No data in response:', response);
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('❌ ApprovalsPage: Error fetching approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave approvals',
        variant: 'destructive',
      });
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchIndividualApproval = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await managerAPI.getLeaveApprovalById(requestId);
      
      if (response.success && response.data) {
        const request = response.data as unknown as LeaveRequest;
        setIndividualRequest(request);
        
        // Automatically fetch leave balance for the employee
        if (request.employee?.id) {
          console.log('🔍 ApprovalsPage: Auto-fetching leave balance for employee:', request.employee.id);
          await fetchLeaveBalance(request.employee.id);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Leave request not found',
          variant: 'destructive',
        });
        navigate('/manager/approvals');
      }
    } catch (error) {
      console.error('Error fetching individual approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave request details',
        variant: 'destructive',
      });
      navigate('/manager/approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApprovals();
    setIsRefreshing(false);
  };

  const fetchLeaveBalance = async (employeeId: string) => {
    if (leaveBalances[employeeId] || loadingBalances[employeeId]) {
      return; // Already loaded or loading
    }

    try {
      setLoadingBalances(prev => ({ ...prev, [employeeId]: true }));
      const response = await managerAPI.getTeamMemberLeaveBalance(employeeId);
      
      if (response.success && response.data) {
        setLeaveBalances(prev => ({ ...prev, [employeeId]: response.data }));
      }
    } catch (error) {
      console.error('Error fetching leave balance for employee:', employeeId, error);
    } finally {
      setLoadingBalances(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const openLeaveBalanceModal = (employee: {id: string, name: string}) => {
    setSelectedEmployee(employee);
    setShowLeaveBalanceModal(true);
  };

  const handleApprove = async (requestId: string) => {
    try {
      setIsProcessing(true);
      const response = await managerAPI.processApprovalAction({
        requestId,
        action: 'approve',
        comments: 'Approved by manager',
      });

      if (response.success) {
        toast({
          title: 'Request Approved',
          description: 'Leave request has been approved successfully',
        });
        
        // Use the new data refresh system
        await refreshAfterLeaveAction('approve');
        
        // Also refresh local data
        await handleRefresh();
      } else {
        throw new Error(response.message || 'Failed to approve request');
      }
    } catch (error: unknown) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setIsProcessing(true);
      const response = await managerAPI.processApprovalAction({
        requestId,
        action: 'reject',
        comments: 'Rejected by manager',
      });

      if (response.success) {
        toast({
          title: 'Request Rejected',
          description: 'Leave request has been rejected',
        });
        
        // Use the new data refresh system
        await refreshAfterLeaveAction('reject');
        
        // Also refresh local data
        await handleRefresh();
      } else {
        throw new Error(response.message || 'Failed to reject request');
      }
    } catch (error: unknown) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || request.status === filters.status;
    const matchesType = filters.leaveType === 'all' || request.leaveType === filters.leaveType;
    const matchesPriority = filters.priority === 'all' || request.priority === filters.priority;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckCircle2 className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading approvals...</p>
        </div>
      </div>
    );
  }

  // Individual approval view
  if (id && individualRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Leave Request Details</h1>
                <p className="text-slate-600 mt-2">Review and manage this leave request</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/manager/approvals')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Approvals
              </Button>
            </div>
          </div>

          {/* Request Details Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employee Info */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg">
                        {individualRequest.employee.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{individualRequest.employee.name}</h3>
                      {individualRequest.employee.employeeId && (
                        <p className="text-sm font-medium text-blue-600 mb-1">ID: {individualRequest.employee.employeeId}</p>
                      )}
                      <p className="text-slate-600">{individualRequest.employee.email}</p>
                      <Badge className={`mt-2 ${getStatusColor(individualRequest.status)}`}>
                        {individualRequest.status.charAt(0).toUpperCase() + individualRequest.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Leave Type</Label>
                      <p className="text-slate-900 font-medium">{individualRequest.leaveType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Duration</Label>
                      <p className="text-slate-900 font-medium">
                        {new Date(individualRequest.startDate).toLocaleDateString()} - {new Date(individualRequest.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Total Days</Label>
                      <p className="text-slate-900 font-medium">{individualRequest.totalDays} days</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Priority</Label>
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(individualRequest.priority)}
                        <Badge className={getPriorityColor(individualRequest.priority)}>
                          {individualRequest.priority.charAt(0).toUpperCase() + individualRequest.priority.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Reason</Label>
                    <p className="text-slate-900 mt-2 p-4 bg-slate-50 rounded-lg">
                      {individualRequest.reason}
                    </p>
                  </div>

                  {individualRequest.emergencyContact && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Emergency Contact</Label>
                      <p className="text-slate-900 mt-2">{individualRequest.emergencyContact}</p>
                    </div>
                  )}

                  {individualRequest.workHandover && (
                    <div>
                      <Label className="text-sm font-medium text-slate-700">Work Handover</Label>
                      <p className="text-slate-900 mt-2 p-4 bg-slate-50 rounded-lg">
                        {individualRequest.workHandover}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Submitted</Label>
                    <p className="text-slate-900 mt-2">
                      {new Date(individualRequest.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave Balance Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-900">Employee Leave Balance</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openLeaveBalanceModal({id: individualRequest.employee.id, name: individualRequest.employee.name})}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
                {loadingBalances[individualRequest.employee.id] ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : leaveBalances[individualRequest.employee.id] ? (
                  <LeaveBalanceOverviewCard 
                    leaveBalance={{
                      annual: {
                        total: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.annual?.total) || 0,
                        used: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.annual?.used) || 0,
                        remaining: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.annual?.remaining) || 0
                      },
                      sick: {
                        total: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.sick?.total) || 0,
                        used: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.sick?.used) || 0,
                        remaining: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.sick?.remaining) || 0
                      },
                      casual: {
                        total: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.casual?.total) || 0,
                        used: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.casual?.used) || 0,
                        remaining: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.casual?.remaining) || 0
                      },
                      emergency: {
                        total: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.emergency?.total) || 0,
                        used: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.emergency?.used) || 0,
                        remaining: ((leaveBalances[individualRequest.employee.id] as any)?.leaveBalance?.emergency?.remaining) || 0
                      }
                    }}
                    title=""
                    description=""
                  />
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Button
                      variant="outline"
                      onClick={() => fetchLeaveBalance(individualRequest.employee.id)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Load Leave Balance
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {individualRequest.status === 'pending' && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(individualRequest.id)}
                      disabled={isProcessing}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button
                      onClick={() => handleApprove(individualRequest.id)}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader
          title="Leave Approvals"
          subtitle="Manage and review team leave requests"
          icon={UserCheck}
          iconColor="from-blue-600 to-purple-600"
        >
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="bg-white/50 border-white/20 hover:bg-white/80"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </PageHeader>

        {/* Enhanced Filters and Search */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
          <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl mb-8">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Filter & Search</h3>
                    <p className="text-sm text-slate-600">Find specific leave requests</p>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                  <div className="w-full lg:w-80">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Search by employee name or leave type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 h-11"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium text-slate-700 block mb-2">Status</Label>
                        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full">
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
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium text-slate-700 block mb-2">Leave Type</Label>
                        <Select value={filters.leaveType} onValueChange={(value) => setFilters(prev => ({ ...prev, leaveType: value }))}>
                          <SelectTrigger className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full transition-all duration-200 hover:border-slate-300 shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 rounded-md shadow-lg z-50 p-1 min-w-[160px]">
                            <SelectItem value="all" className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <span className="font-medium">All Types</span>
                            </SelectItem>
                            <SelectItem value="annual" className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <span className="font-medium">Annual Leave</span>
                            </SelectItem>
                            <SelectItem value="sick" className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <span className="font-medium">Sick Leave</span>
                            </SelectItem>
                            <SelectItem value="casual" className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <span className="font-medium">Casual Leave</span>
                            </SelectItem>
                            <SelectItem value="emergency" className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <span className="font-medium">Emergency Leave</span>
                            </SelectItem>
                            <SelectItem value="maternity" className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <span className="font-medium">Maternity Leave</span>
                            </SelectItem>
                            <SelectItem value="paternity" className="cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <span className="font-medium">Paternity Leave</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-sm font-medium text-slate-700 block mb-2">Priority</Label>
                        <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger className="h-11 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Leave Requests</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="bg-white/50 border-white/20">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                          {request.employee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{request.employee.name}</h3>
                          {request.employee.employeeId && (
                            <span className="text-xs font-medium text-blue-600">ID: {request.employee.employeeId}</span>
                          )}
                          <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)}`}>
                            {request.status}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(request.priority)}`}>
                            {getPriorityIcon(request.priority)}
                            <span className="ml-1">{request.priority}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {request.leaveType} • {request.days} day{request.days !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          {loadingBalances[request.employee.id] ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              <span className="text-xs text-muted-foreground">Loading balance...</span>
                            </div>
                          ) : leaveBalances[request.employee.id] ? (
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-muted-foreground">
                                Balance: {Object.entries(leaveBalances[request.employee.id] || {})
                                  .filter(([key]) => key !== 'total')
                                  .map(([type, balance]: [string, any]) => `${balance?.remaining || 0}${type.charAt(0).toUpperCase()}`)
                                  .join(' / ')}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLeaveBalanceModal({id: request.employee.id, name: request.employee.name})}
                                className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                View Details
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchLeaveBalance(request.employee.id)}
                                className="h-6 px-2 text-xs"
                              >
                                View Balance
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLeaveBalanceModal({id: request.employee.id, name: request.employee.name})}
                                className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-slate-100"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            disabled={isProcessing}
                            className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No requests found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filters.status !== 'all' || filters.leaveType !== 'all' || filters.priority !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'No leave requests to review at the moment'
                  }
                </p>
                {(searchTerm || filters.status !== 'all' || filters.leaveType !== 'all' || filters.priority !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({ status: 'all', leaveType: 'all', priority: 'all' });
                    }}
                    className="bg-white/50 border-white/20"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Leave Request Details</span>
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg">
                    {selectedRequest.employee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedRequest.employee.name}</h3>
                  <p className="text-muted-foreground">{selectedRequest.employee.department}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.employee.email}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Leave Type</label>
                  <p className="text-lg font-semibold">{selectedRequest.leaveType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <p className="text-lg font-semibold">{selectedRequest.days} day{selectedRequest.days !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-lg font-semibold">{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="text-lg font-semibold">{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="text-lg font-semibold mt-1">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.emergencyContact && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                  <p className="text-lg font-semibold mt-1">{selectedRequest.emergencyContact}</p>
                </div>
              )}

              {selectedRequest.workHandover && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Work Handover</label>
                  <p className="text-lg font-semibold mt-1">{selectedRequest.workHandover}</p>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(selectedRequest.priority)}>
                    {getPriorityIcon(selectedRequest.priority)}
                    <span className="ml-1">{selectedRequest.priority} priority</span>
                  </Badge>
                </div>
                {selectedRequest.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      disabled={isProcessing}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Balance Modal */}
      <LeaveBalanceModal
        isOpen={showLeaveBalanceModal}
        onClose={() => {
          setShowLeaveBalanceModal(false);
          setSelectedEmployee(null);
        }}
        userId={selectedEmployee?.id}
        userName={selectedEmployee?.name}
        fetchLeaveBalanceFn={managerAPI.getTeamMemberLeaveBalance}
      />
    </div>
  );
};

export default ApprovalsPage;