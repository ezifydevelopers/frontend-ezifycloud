import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  History,
  Filter,
  Download,
  RefreshCw,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Plus,
  ArrowUpDown,
  Clock,
  MessageSquare,
  File,
  UserCheck,
  UserMinus,
} from 'lucide-react';
import { boardAPI, workspaceAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Activity {
  id: string;
  itemId: string;
  userId: string;
  action: string;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  details?: Record<string, unknown>;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

interface ActivityLogProps {
  itemId?: string;
  boardId?: string;
  workspaceId?: string;
  className?: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  itemId,
  boardId,
  workspaceId,
  className,
}) => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const fetchActivities = useCallback(async () => {
    if (!itemId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await boardAPI.getItemActivities(itemId, { page: 1, limit: 100 });
      
      if (response.success && response.data) {
        const data = response.data as { activities: Activity[]; total: number };
        setActivities(data.activities || []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activity log',
        variant: 'destructive',
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [itemId, toast]);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const response = await workspaceAPI.getWorkspaceMembers(workspaceId);
      if (response.success && response.data) {
        const membersData = Array.isArray(response.data) ? response.data : [];
        const formattedMembers = membersData.map((member: Record<string, unknown>) => ({
          id: String(member.userId || (member.user && typeof member.user === 'object' && 'id' in member.user ? member.user.id : '')),
          name: String(
            member.user && typeof member.user === 'object' && 'name' in member.user
              ? member.user.name
              : member.email || 'Unknown'
          ),
          email: String(
            member.user && typeof member.user === 'object' && 'email' in member.user
              ? member.user.email
              : member.email || ''
          ),
        }));
        setMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchActivities();
    if (workspaceId) {
      fetchMembers();
    }
  }, [fetchActivities, fetchMembers, workspaceId]);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'updated':
      case 'edited':
      case 'field_updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'status_changed':
      case 'status':
        return <ArrowUpDown className="h-4 w-4 text-orange-600" />;
      case 'comment_created':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'file_uploaded':
        return <File className="h-4 w-4 text-indigo-600" />;
      case 'assigned':
      case 'assignment_updated':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'unassigned':
        return <UserMinus className="h-4 w-4 text-orange-600" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower === 'created') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Created</Badge>;
    }
    if (actionLower.includes('updated') || actionLower.includes('edited') || actionLower === 'field_updated') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Updated</Badge>;
    }
    if (actionLower.includes('deleted')) {
      return <Badge variant="destructive">Deleted</Badge>;
    }
    if (actionLower.includes('status')) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Status Changed</Badge>;
    }
    if (actionLower === 'comment_created') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Comment</Badge>;
    }
    if (actionLower === 'file_uploaded') {
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">File Upload</Badge>;
    }
    if (actionLower === 'assigned' || actionLower === 'assignment_updated') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Assigned</Badge>;
    }
    if (actionLower === 'unassigned') {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Unassigned</Badge>;
    }
    if (actionLower.includes('approved')) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
    }
    if (actionLower.includes('rejected')) {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="outline" className="capitalize">{action.replace(/_/g, ' ')}</Badge>;
  };

  const renderActivityContent = (activity: Activity) => {
    // Field updates
    if (activity.action === 'field_updated' && activity.fieldName) {
      return (
        <div className="text-sm">
          <span className="font-medium">{activity.fieldName}</span> changed
          {activity.oldValue !== undefined && activity.newValue !== undefined && (
            <div className="mt-1 text-muted-foreground">
              <span className="line-through">{String(activity.oldValue)}</span>
              {' → '}
              <span className="font-medium">{String(activity.newValue)}</span>
            </div>
          )}
        </div>
      );
    }

    // Status changes
    if (activity.action === 'status_changed') {
      const details = activity.details as Record<string, unknown> | undefined;
      const newStatus = activity.newValue || details?.newStatus;
      const oldStatus = activity.oldValue || details?.oldStatus;
      return (
        <div className="text-sm">
          Status changed {oldStatus && <span className="text-muted-foreground">from <Badge variant="outline" className="mx-1">{String(oldStatus)}</Badge></span>}
          to <Badge variant="outline" className="ml-1">{String(newStatus)}</Badge>
        </div>
      );
    }

    // Comment created
    if (activity.action === 'comment_created') {
      const details = activity.details as Record<string, unknown> | undefined;
      const fileCount = typeof details?.fileCount === 'number' ? details.fileCount : 0;
      const mentions = Array.isArray(details?.mentions) ? details.mentions : [];
      return (
        <div className="text-sm">
          Added a comment
          {details?.hasFiles && fileCount > 0 && (
            <span className="text-muted-foreground ml-1">
              with {fileCount} file{fileCount > 1 ? 's' : ''}
            </span>
          )}
          {mentions.length > 0 && (
            <span className="text-muted-foreground ml-1">
              mentioning {mentions.length} user{mentions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      );
    }

    // File uploaded
    if (activity.action === 'file_uploaded') {
      const details = activity.details as Record<string, unknown> | undefined;
      const fileName = typeof details?.fileName === 'string' ? details.fileName : 'Unknown';
      const fileSize = typeof details?.fileSize === 'number' ? details.fileSize : 0;
      return (
        <div className="text-sm">
          Uploaded file <span className="font-medium">{fileName}</span>
          {fileSize > 0 && (
            <span className="text-muted-foreground ml-1">
              ({(fileSize / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
      );
    }

    // Item created
    if (activity.action === 'created') {
      const details = activity.details as Record<string, unknown> | undefined;
      const itemName = typeof details?.name === 'string' ? details.name : 'this item';
      const status = typeof details?.status === 'string' ? details.status : null;
      return (
        <div className="text-sm">
          Created item <span className="font-medium">{itemName}</span>
          {status && (
            <span className="text-muted-foreground ml-1">
              with status <Badge variant="outline" className="ml-1">{status}</Badge>
            </span>
          )}
        </div>
      );
    }

    // Item updated
    if (activity.action === 'updated') {
      return (
        <div className="text-sm text-muted-foreground">
          Item updated
        </div>
      );
    }

    // Item deleted
    if (activity.action === 'deleted') {
      return (
        <div className="text-sm text-red-600">
          Item deleted
        </div>
      );
    }

    // Assignment actions
    if (activity.action === 'assigned' || activity.action === 'assignment_updated' || activity.action === 'unassigned') {
      const details = activity.details as Record<string, unknown> | undefined;
      const newlyAssigned = Array.isArray(details?.newlyAssigned) ? details.newlyAssigned as string[] : [];
      const unassigned = Array.isArray(details?.unassigned) ? details.unassigned as string[] : [];
      const columnName = typeof details?.columnName === 'string' ? details.columnName : activity.fieldName || 'Assignment';
      
      if (activity.action === 'assigned' && newlyAssigned.length > 0) {
        return (
          <div className="text-sm">
            Assigned {newlyAssigned.length} user{newlyAssigned.length > 1 ? 's' : ''} to <span className="font-medium">{columnName}</span>
          </div>
        );
      }
      
      if (activity.action === 'unassigned' && unassigned.length > 0) {
        return (
          <div className="text-sm">
            Unassigned {unassigned.length} user{unassigned.length > 1 ? 's' : ''} from <span className="font-medium">{columnName}</span>
          </div>
        );
      }
      
      if (activity.action === 'assignment_updated') {
        const parts: string[] = [];
        if (newlyAssigned.length > 0) {
          parts.push(`assigned ${newlyAssigned.length} user${newlyAssigned.length > 1 ? 's' : ''}`);
        }
        if (unassigned.length > 0) {
          parts.push(`unassigned ${unassigned.length} user${unassigned.length > 1 ? 's' : ''}`);
        }
        return (
          <div className="text-sm">
            {parts.join(' and ')} in <span className="font-medium">{columnName}</span>
          </div>
        );
      }
    }

    // Default
    return (
      <div className="text-sm text-muted-foreground capitalize">
        {activity.action.replace(/_/g, ' ')}
      </div>
    );
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter.action && !activity.action.toLowerCase().includes(filter.action.toLowerCase())) {
      return false;
    }
    if (filter.userId && activity.userId !== filter.userId) {
      return false;
    }
    if (filter.dateFrom || filter.dateTo) {
      const activityDate = new Date(activity.createdAt);
      if (filter.dateFrom && activityDate < new Date(filter.dateFrom)) {
        return false;
      }
      if (filter.dateTo && activityDate > new Date(filter.dateTo)) {
        return false;
      }
    }
    return true;
  });

  const handleExport = () => {
    try {
      // Prepare CSV data
      const headers = ['Date', 'Time', 'User', 'Action', 'Field Name', 'Old Value', 'New Value', 'Details'];
      
      const rows = filteredActivities.map(activity => {
        const date = new Date(activity.createdAt);
        const dateStr = format(date, 'yyyy-MM-dd');
        const timeStr = format(date, 'HH:mm:ss');
        const userName = activity.user?.name || 'Unknown';
        const action = activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const fieldName = activity.fieldName || '';
        
        // Format old and new values
        let oldValue = '';
        let newValue = '';
        if (activity.oldValue !== undefined && activity.oldValue !== null) {
          oldValue = typeof activity.oldValue === 'object' 
            ? JSON.stringify(activity.oldValue) 
            : String(activity.oldValue);
        }
        if (activity.newValue !== undefined && activity.newValue !== null) {
          newValue = typeof activity.newValue === 'object' 
            ? JSON.stringify(activity.newValue) 
            : String(activity.newValue);
        }
        
        // Format details
        let detailsStr = '';
        if (activity.details && Object.keys(activity.details).length > 0) {
          detailsStr = JSON.stringify(activity.details);
        }
        
        // Escape CSV special characters
        const escapeCSV = (value: string) => {
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };
        
        return [
          escapeCSV(dateStr),
          escapeCSV(timeStr),
          escapeCSV(userName),
          escapeCSV(action),
          escapeCSV(fieldName),
          escapeCSV(oldValue),
          escapeCSV(newValue),
          escapeCSV(detailsStr),
        ];
      });
      
      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `activity-log-${itemId || 'all'}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: `Exported ${filteredActivities.length} activities to CSV`,
      });
    } catch (error) {
      console.error('Error exporting activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to export activities',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Activity Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchActivities}
              title="Refresh activities"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={filteredActivities.length === 0}
              title={filteredActivities.length === 0 ? 'No activities to export' : 'Export activities to CSV'}
            >
              <Download className="h-4 w-4 mr-2" />
              Export ({filteredActivities.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="md:col-span-4 flex items-center gap-2 mb-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters</span>
            {(filter.action || filter.userId || filter.dateFrom || filter.dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs ml-auto"
                onClick={() => setFilter({})}
              >
                Clear filters
              </Button>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Action</label>
            <Select
              value={filter.action || 'all'}
              onValueChange={(value) =>
                setFilter((prev) => ({ ...prev, action: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="field_updated">Field Updated</SelectItem>
                <SelectItem value="status_changed">Status Changed</SelectItem>
                <SelectItem value="comment_created">Comment</SelectItem>
                <SelectItem value="file_uploaded">File Upload</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">User</label>
            <Select
              value={filter.userId || 'all'}
              onValueChange={(value) =>
                setFilter((prev) => ({ ...prev, userId: value === 'all' ? undefined : value }))
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
            <Input
              type="date"
              value={filter.dateFrom || ''}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))
              }
              className="h-8"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
            <Input
              type="date"
              value={filter.dateTo || ''}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, dateTo: e.target.value || undefined }))
              }
              className="h-8"
            />
          </div>
        </div>

        {/* Activity Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  'flex gap-4 pb-4',
                  index < filteredActivities.length - 1 && 'border-b border-slate-200'
                )}
              >
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-300">
                    {getActionIcon(activity.action)}
                  </div>
                  {index < filteredActivities.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-200 mt-2 flex-1" />
                  )}
                </div>

                {/* Activity content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user?.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {activity.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{activity.user?.name || 'Unknown User'}</span>
                      {getActionBadge(activity.action)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {renderActivityContent(activity)}
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-muted-foreground">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(activity.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

