import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminAPI } from '@/lib/api';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { triggerDashboardRefresh } from '@/contexts/DashboardContext';
import { toast } from '@/hooks/use-toast';
import LeaveRequestDetails from '@/components/leave/LeaveRequestDetails';
import LeaveBalanceModal from '@/components/admin/LeaveBalanceModal';
import { LeaveRequest, LeaveBalance } from '@/types/leave';
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  RefreshCw
} from 'lucide-react';

interface LeaveRequestsTableProps {
  showStats?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({
  showStats = true,
  showFilters = true,
  showExport = true,
  onRefresh,
  className = ''
}) => {
  const { refreshAfterLeaveAction } = useDataRefresh();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getLeaveRequests({});
      
      if (response.success && response.data) {
        const requests = Array.isArray(response.data) ? response.data : response.data.data || [];
        setLeaveRequests(requests);
      } else {
        setLeaveRequests([]);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async (employeeId: string) => {
    if (leaveBalances[employeeId] || loadingBalances[employeeId]) {
      return;
    }

    try {
      setLoadingBalances(prev => ({ ...prev, [employeeId]: true }));
      const response = await adminAPI.getEmployeeLeaveBalance(employeeId);
      
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

  const handleApprove = async (requestId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      const response = await adminAPI.updateLeaveRequestStatus(requestId, 'approved', 'Approved by admin');
      
      if (response.success) {
        toast({
          title: 'Request approved',
          description: 'Leave request has been approved successfully',
        });
        
        await refreshAfterLeaveAction('approve');
        await fetchLeaveRequests();
        triggerDashboardRefresh();
        onRefresh?.();
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
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      const response = await adminAPI.updateLeaveRequestStatus(requestId, 'rejected', 'Rejected by admin');
      
      if (response.success) {
        toast({
          title: 'Request rejected',
          description: 'Leave request has been rejected',
        });
        
        await refreshAfterLeaveAction('reject');
        await fetchLeaveRequests();
        triggerDashboardRefresh();
        onRefresh?.();
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
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    switch (leaveType) {
      case 'Annual Leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sick Leave':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Casual Leave':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Maternity Leave':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Paternity Leave':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = {
    totalRequests: leaveRequests.length,
    pendingRequests: leaveRequests.filter(req => req.status === 'pending').length,
    approvedRequests: leaveRequests.filter(req => req.status === 'approved').length,
    rejectedRequests: leaveRequests.filter(req => req.status === 'rejected').length,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      {showStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.approvedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Rejected</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.rejectedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      {showFilters && (
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-slate-200/50 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showExport && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests Table */}
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xl">Leave Requests ({filteredRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="font-semibold">Employee</TableHead>
                    <TableHead className="font-semibold">Leave Type</TableHead>
                    <TableHead className="font-semibold">Dates</TableHead>
                    <TableHead className="font-semibold">Days</TableHead>
                    <TableHead className="font-semibold">Leave Balance</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request, index) => (
                    <TableRow 
                      key={request.id} 
                      className="group hover:bg-slate-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                              {request.employee.avatar || request.employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">{request.employee.name}</p>
                            <p className="text-sm text-slate-500">{request.employee.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeaveTypeColor(request.leaveType)}>
                          {request.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">
                            {new Date(request.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-slate-500">
                            to {new Date(request.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{request.totalDays}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          {loadingBalances[request.employee.id] ? (
                            <div className="flex items-center justify-center py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          ) : leaveBalances[request.employee.id] ? (
                            <div className="space-y-1">
                              <div className="text-xs text-slate-600">
                                <div>A: {leaveBalances[request.employee.id]?.annual?.remaining || 0}</div>
                                <div>S: {leaveBalances[request.employee.id]?.sick?.remaining || 0}</div>
                                <div>C: {leaveBalances[request.employee.id]?.casual?.remaining || 0}</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openLeaveBalanceModal({id: request.employee.id, name: request.employee.name})}
                                className="text-xs h-5 px-2 w-full"
                              >
                                View Details
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                fetchLeaveBalance(request.employee.id);
                                openLeaveBalanceModal({id: request.employee.id, name: request.employee.name});
                              }}
                              className="text-xs h-6 px-2"
                            >
                              View Balance
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority || 'low')}>
                          {request.priority || 'Low'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => handleApprove(request.id, e)}
                                disabled={processingRequests.has(request.id)}
                                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {processingRequests.has(request.id) ? 'Approving...' : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleReject(request.id, e)}
                                disabled={processingRequests.has(request.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                {processingRequests.has(request.id) ? 'Rejecting...' : 'Reject'}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                            className="h-8 px-3"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Request Details Modal */}
      {selectedRequest && (
        <LeaveRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => {
            handleApprove(selectedRequest.id);
            setSelectedRequest(null);
          }}
          onReject={() => {
            handleReject(selectedRequest.id);
            setSelectedRequest(null);
          }}
        />
      )}

      {/* Leave Balance Modal */}
      <LeaveBalanceModal
        isOpen={showLeaveBalanceModal}
        onClose={() => {
          setShowLeaveBalanceModal(false);
          setSelectedEmployee(null);
        }}
        userId={selectedEmployee?.id}
        userName={selectedEmployee?.name}
      />
    </div>
  );
};

export default LeaveRequestsTable;
