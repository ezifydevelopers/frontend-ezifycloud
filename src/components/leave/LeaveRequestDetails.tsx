import React from 'react';
import { LeaveRequest } from '@/types/leave';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Building,
} from 'lucide-react';

interface LeaveRequestDetailsProps {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const LeaveRequestDetails: React.FC<LeaveRequestDetailsProps> = ({
  request,
  onClose,
  onApprove,
  onReject,
}) => {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Leave Request Details
          </DialogTitle>
          <DialogDescription>
            Review the leave request details and take appropriate action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Information */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Employee Information
            </h3>
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {request.employee?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-slate-900">{request.employee?.name || 'Unknown Employee'}</p>
                  <p className="text-sm text-slate-600">ID: {request.employee?.id || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {request.employee?.department || 'Unassigned'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Details */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Leave Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Leave Type</p>
                <p className="font-medium text-slate-900 capitalize">{request.leaveType || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Duration</p>
                <p className="font-medium text-slate-900">{request.totalDays || 0} day{(request.totalDays || 0) !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Start Date</p>
                <p className="font-medium text-slate-900">{formatDate(request.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">End Date</p>
                <p className="font-medium text-slate-900">{formatDate(request.endDate)}</p>
              </div>
              {request.isHalfDay && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-600">Half Day Period</p>
                  <p className="font-medium text-slate-900 capitalize">{request.halfDayPeriod || 'Unknown'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-slate-600 mb-1">Status</p>
              <Badge className={getStatusColor(request.status || 'pending')}>
                {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Pending'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Priority</p>
              <Badge className={getPriorityColor(request.priority || 'low')}>
                {request.priority ? request.priority.charAt(0).toUpperCase() + request.priority.slice(1) : 'Low'}
              </Badge>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reason for Leave
            </h3>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-slate-700">{request.reason || 'No reason provided'}</p>
            </div>
          </div>

          {/* Additional Information */}
          {(request.emergencyContact || request.workHandover) && (
            <div className="space-y-4">
              {request.emergencyContact && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-slate-700">{request.emergencyContact || 'No emergency contact provided'}</p>
                  </div>
                </div>
              )}
              {request.workHandover && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Work Handover
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-slate-700">{request.workHandover || 'No work handover provided'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Submission Information
            </h3>
            <p className="text-sm text-slate-600">
              Submitted on {formatDateTime(request.submittedAt)}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {request?.status === 'pending' && (
            <>
              <Button
                variant="destructive"
                onClick={onReject}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={onApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveRequestDetails;
