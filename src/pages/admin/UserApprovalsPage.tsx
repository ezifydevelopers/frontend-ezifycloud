import React, { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '@/lib/api/adminAPI';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User as UserIcon, 
  Mail, 
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  CheckSquare,
  XSquare,
  ChevronUp,
  ChevronDown,
  Phone,
  MapPin,
  Shield,
  Sparkles,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PendingUser extends User {
  approvalStatus?: string;
  phone?: string;
}

const UserApprovalsPage: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  
  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<PendingUser | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'department' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({
    total: 0,
    employees: 0,
    managers: 0,
    today: 0
  });

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getPendingApprovals({ page, limit: 10 });
      
      if (response.success && response.data) {
        const users = response.data.data || [];
        setPendingUsers(users);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
        
        // Calculate statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = users.filter(u => {
          const created = new Date(u.createdAt || '');
          created.setHours(0, 0, 0, 0);
          return created.getTime() === today.getTime();
        }).length;
        
        setStats({
          total: response.data.total || 0,
          employees: users.filter(u => u.role === 'employee').length,
          managers: users.filter(u => u.role === 'manager').length,
          today: todayCount
        });
      } else {
        setError(response.message || 'Failed to fetch pending approvals');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [page]);

  // Get unique departments from users
  const departments = useMemo(() => {
    const depts = new Set<string>();
    pendingUsers.forEach(user => {
      if (user.department) depts.add(user.department);
    });
    return Array.from(depts).sort();
  }, [pendingUsers]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...pendingUsers];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.department?.toLowerCase().includes(search)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'department':
          aValue = a.department || '';
          bValue = b.department || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [pendingUsers, searchTerm, roleFilter, departmentFilter, sortBy, sortOrder]);

  const handleApprove = async (userId: string) => {
    try {
      setProcessing(userId);
      const response = await adminAPI.approveUserAccess(userId);
      
      if (response.success) {
        toast({
          title: 'User Approved',
          description: 'User access has been approved successfully.',
        });
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
        fetchPendingApprovals();
      } else {
        throw new Error(response.message || 'Failed to approve user');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setProcessing('bulk');
      const promises = selectedUsers.map(userId => adminAPI.approveUserAccess(userId));
      await Promise.all(promises);
      
      toast({
        title: 'Bulk Approval Successful',
        description: `${selectedUsers.length} user(s) have been approved successfully.`,
      });
      setSelectedUsers([]);
      fetchPendingApprovals();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve users',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(selectedUser.id);
      const response = await adminAPI.rejectUserAccess(selectedUser.id, rejectionReason);
      
      if (response.success) {
        toast({
          title: 'User Rejected',
          description: 'User access has been rejected.',
        });
        setRejectDialogOpen(false);
        setSelectedUser(null);
        setRejectionReason('');
        setSelectedUsers(selectedUsers.filter(id => id !== selectedUser.id));
        fetchPendingApprovals();
      } else {
        throw new Error(response.message || 'Failed to reject user');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject user',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setProcessing('bulk');
      const promises = selectedUsers.map(userId => adminAPI.rejectUserAccess(userId, 'Bulk rejection'));
      await Promise.all(promises);
      
      toast({
        title: 'Bulk Rejection Successful',
        description: `${selectedUsers.length} user(s) have been rejected.`,
      });
      setSelectedUsers([]);
      fetchPendingApprovals();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject users',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredAndSortedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredAndSortedUsers.map(u => u.id));
    }
  };

  const openRejectDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setRejectDialogOpen(true);
  };

  const openUserDetails = (user: PendingUser) => {
    setViewingUser(user);
    setUserDetailsOpen(true);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportData = () => {
    const data = filteredAndSortedUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Department: user.department || 'N/A',
      Phone: user.phone || 'N/A',
      'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-approvals-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Pending approvals data has been exported.',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  if (loading && pendingUsers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  User Approvals
                </h1>
                <p className="text-muted-foreground mt-1">
                  Review and approve pending user registrations
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={exportData} 
              variant="outline" 
              size="sm" 
              disabled={filteredAndSortedUsers.length === 0}
              className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={fetchPendingApprovals} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-900">Total Pending</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
              <p className="text-xs text-blue-700/80 mt-1">Users awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-900">Employees</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserIcon className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.employees}</div>
              <p className="text-xs text-green-700/80 mt-1">Employee requests</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-900">Managers</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.managers}</div>
              <p className="text-xs text-purple-700/80 mt-1">Manager requests</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-orange-900">Today</CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{stats.today}</div>
              <p className="text-xs text-orange-700/80 mt-1">Registered today</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters and Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                {(selectedUsers.length > 0) && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={processing === 'bulk'}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                    >
                      {processing === 'bulk' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckSquare className="h-4 w-4 mr-2" />
                      )}
                      Approve ({selectedUsers.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkReject}
                      disabled={processing === 'bulk'}
                      className="flex-1 shadow-md"
                    >
                      {processing === 'bulk' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XSquare className="h-4 w-4 mr-2" />
                      )}
                      Reject ({selectedUsers.length})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {filteredAndSortedUsers.length === 0 && !loading ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">No Pending Approvals</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all'
                  ? 'No users match your filters. Try adjusting your search criteria.'
                  : 'All user registrations have been processed. Great job!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    Pending User Approvals
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {filteredAndSortedUsers.length} user{filteredAndSortedUsers.length !== 1 ? 's' : ''} {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all' ? 'found' : 'waiting for approval'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.length === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100/50 transition-colors font-semibold"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          User
                          <SortIcon field="name" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100/50 transition-colors font-semibold"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-2">
                          Email
                          <SortIcon field="email" />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold">
                        Employee ID
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100/50 transition-colors font-semibold"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center gap-2">
                          Role
                          <SortIcon field="role" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100/50 transition-colors font-semibold"
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center gap-2">
                          Department
                          <SortIcon field="department" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100/50 transition-colors font-semibold"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-2">
                          Registered
                          <SortIcon field="createdAt" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        className="hover:bg-blue-50/30 transition-colors border-b border-gray-100"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-blue-100">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {getInitials(user.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.employeeId ? (
                            <span className="text-sm font-medium text-blue-600">{user.employeeId}</span>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)} border font-medium`}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {user.department || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {user.createdAt 
                              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUserDetails(user)}
                              className="border-gray-200 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(user.id)}
                              disabled={processing === user.id}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm"
                            >
                              {processing === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(user)}
                              disabled={processing === user.id}
                              className="shadow-sm"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-gray-200"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium">
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-gray-200"
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Details Dialog */}
        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                User Details
              </DialogTitle>
              <DialogDescription>
                Review user information before making a decision
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Avatar className="h-16 w-16 border-2 border-blue-200">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                      {getInitials(viewingUser.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{viewingUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <Badge className={`${getRoleBadgeColor(viewingUser.role)} border`}>
                      {viewingUser.role}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-base font-medium">{viewingUser.department || 'N/A'}</p>
                  </div>
                  {viewingUser.phone && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-base">{viewingUser.phone}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                    <p className="text-base">
                      {viewingUser.createdAt 
                        ? new Date(viewingUser.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setUserDetailsOpen(false)}
                    className="border-gray-200"
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setUserDetailsOpen(false);
                      openRejectDialog(viewingUser);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setUserDetailsOpen(false);
                      handleApprove(viewingUser.id);
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                Reject User Access
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to reject access for <span className="font-semibold">{selectedUser?.name}</span>? 
                You can provide a reason below (optional).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setSelectedUser(null);
                  setRejectionReason('');
                }}
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing === selectedUser?.id}
              >
                {processing === selectedUser?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Access
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserApprovalsPage;
