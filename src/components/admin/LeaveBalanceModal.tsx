import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adminAPI } from '@/lib/api';
import { User, Calendar, TrendingUp, RefreshCw, Download, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdjustLeaveBalanceDialog from '@/components/dialogs/AdjustLeaveBalanceDialog';
import { useAuth } from '@/contexts/AuthContext';

interface LeaveBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  fetchLeaveBalanceFn?: (userId: string, year?: string) => Promise<any>;
  onAdjustLeave?: () => void;
}

interface LeaveBalanceData {
  [key: string]: {
    total: number;
    used: number;
    remaining: number;
    pending?: number;
    utilizationRate?: number;
  };
}

interface UserLeaveBalance {
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  leaveBalance: LeaveBalanceData;
  total: {
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    pendingDays: number;
    overallUtilization: number;
  };
}

const LeaveBalanceModal: React.FC<LeaveBalanceModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  fetchLeaveBalanceFn,
  onAdjustLeave
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leaveBalanceData, setLeaveBalanceData] = useState<UserLeaveBalance | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedUser, setSelectedUser] = useState(userId || '');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  
  // Update selectedUser when userId prop changes
  useEffect(() => {
    if (userId) {
      setSelectedUser(userId);
    }
  }, [userId]);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  useEffect(() => {
    if (isOpen && selectedUser) {
      fetchLeaveBalance();
    }
  }, [isOpen, selectedUser, selectedYear]);

  const fetchLeaveBalance = async () => {
    try {
      setLoading(true);
      console.log('🔍 LeaveBalanceModal: Fetching leave balance for user:', selectedUser, 'year:', selectedYear);
      
      // If we have a specific user, fetch their leave balance
      if (selectedUser) {
        // Use provided function or fall back to admin API
        const response = fetchLeaveBalanceFn 
          ? await fetchLeaveBalanceFn(selectedUser, selectedYear)
          : await adminAPI.getUserLeaveBalance(selectedUser, selectedYear);
        
        console.log('🔍 LeaveBalanceModal: API response:', response);
        
        if (response.success && response.data) {
          console.log('✅ LeaveBalanceModal: Setting leave balance data:', response.data);
          setLeaveBalanceData(response.data);
        } else {
          console.error('❌ LeaveBalanceModal: API response failed:', response);
          toast({
            title: "Error",
            description: response.message || "Failed to fetch leave balance data",
            variant: "destructive"
          });
        }
      } else {
        console.warn('⚠️ LeaveBalanceModal: No selected user provided');
      }
    } catch (error) {
      console.error('❌ LeaveBalanceModal: Error fetching leave balance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leave balance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return 'from-blue-500 to-cyan-500';
      case 'sick': return 'from-red-500 to-pink-500';
      case 'casual': return 'from-green-500 to-emerald-500';
      case 'emergency': return 'from-orange-500 to-yellow-500';
      case 'maternity': return 'from-purple-500 to-pink-500';
      case 'paternity': return 'from-indigo-500 to-blue-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return '🏖️';
      case 'sick': return '🏥';
      case 'casual': return '😊';
      case 'emergency': return '🚨';
      case 'maternity': return '👶';
      case 'paternity': return '👨‍👶';
      default: return '📅';
    }
  };

  const exportLeaveBalance = () => {
    if (!leaveBalanceData) return;

    const data = {
      user: {
        name: leaveBalanceData.userName,
        email: leaveBalanceData.userEmail,
        department: leaveBalanceData.department
      },
      year: selectedYear,
      leaveBalance: leaveBalanceData.leaveBalance,
      summary: leaveBalanceData.total,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-balance-${leaveBalanceData.userName.replace(/\s+/g, '-')}-${selectedYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Leave balance data exported successfully"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Leave Balance Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              {(user?.role === 'admin' || user?.role === 'manager') && selectedUser && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAdjustDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adjust Leave
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLeaveBalance}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLeaveBalance}
                disabled={!leaveBalanceData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* User Info */}
          {leaveBalanceData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {leaveBalanceData.userName}
                </CardTitle>
                <div className="text-sm text-slate-600">
                  <p>{leaveBalanceData.userEmail}</p>
                  <p>{leaveBalanceData.department}</p>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Leave Balance Details */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading leave balance...</span>
            </div>
          ) : leaveBalanceData ? (
            <div className="space-y-4">
              {/* Individual Leave Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(leaveBalanceData.leaveBalance).map(([type, balance]) => {
                  if (type === 'total') return null;
                  
                  const percentage = balance.total > 0 ? (balance.used / balance.total) * 100 : 0;
                  
                  return (
                    <Card key={type} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getLeaveTypeIcon(type)}</span>
                            <span className="font-semibold capitalize">{type} Leave</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {balance.used.toFixed(1)} / {balance.total} days
                          </Badge>
                        </div>
                        
                        <Progress value={percentage} className="h-2 mb-3" />
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-slate-700">{balance.total}</div>
                            <div className="text-slate-500">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-red-600">{balance.used.toFixed(1)}</div>
                            <div className="text-slate-500">Used</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-600">{balance.remaining.toFixed(1)}</div>
                            <div className="text-slate-500">Remaining</div>
                          </div>
                        </div>
                        
                        {balance.pending && balance.pending > 0 && (
                          <div className="mt-2 text-center">
                            <Badge variant="secondary" className="text-xs">
                              {balance.pending} days pending
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overall Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-700">
                        {leaveBalanceData.total.totalDays}
                      </div>
                      <div className="text-sm text-slate-500">Total Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {leaveBalanceData.total.usedDays.toFixed(1)}
                      </div>
                      <div className="text-sm text-slate-500">Used Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {leaveBalanceData.total.remainingDays.toFixed(1)}
                      </div>
                      <div className="text-sm text-slate-500">Remaining</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {leaveBalanceData.total.overallUtilization.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-500">Utilization</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Progress 
                      value={leaveBalanceData.total.overallUtilization} 
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave balance data available</p>
              <p className="text-sm">Select a user and year to view leave balance</p>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Adjust Leave Balance Dialog */}
      {selectedUser && leaveBalanceData && (
        <AdjustLeaveBalanceDialog
          open={showAdjustDialog}
          onOpenChange={(open) => {
            setShowAdjustDialog(open);
            if (!open && onAdjustLeave) {
              onAdjustLeave();
            }
          }}
          employeeId={selectedUser}
          employeeName={leaveBalanceData.userName}
          onSuccess={() => {
            fetchLeaveBalance();
            if (onAdjustLeave) {
              onAdjustLeave();
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default LeaveBalanceModal;
