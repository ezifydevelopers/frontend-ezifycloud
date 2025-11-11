import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  MoreVertical,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { automationAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AutomationBuilder } from './AutomationBuilder';

interface Automation {
  id: string;
  name: string;
  trigger: Record<string, unknown>;
  actions: Array<Record<string, unknown>>;
  conditions?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  board?: {
    id: string;
    name: string;
  };
}

interface AutomationManagementProps {
  boardId: string;
  columns?: Array<{ id: string; name: string; type: string; isHidden?: boolean }>;
  onAutomationChange?: () => void;
}

export const AutomationManagement: React.FC<AutomationManagementProps> = ({
  boardId,
  columns = [],
  onAutomationChange,
}) => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [executionLogsOpen, setExecutionLogsOpen] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<Array<{
    id: string;
    automationId: string;
    itemId?: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    executedAt: string;
    executionTime?: number;
  }>>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await automationAPI.getAutomations({
        boardId,
        isActive: filterActive === 'all' ? undefined : filterActive === 'active',
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const data = response.data as { data?: unknown[]; pagination?: unknown };
        const automationsData = Array.isArray(data) ? data : (data?.data || []);
        setAutomations(automationsData as Automation[]);
      } else {
        setAutomations([]);
      }
    } catch (error) {
      // Handle errors gracefully - 500 errors are server issues, don't spam user
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isServerError = 
        errorMessage.includes('500') || 
        errorMessage.includes('Internal Server Error') ||
        errorMessage.includes('Internal server error');
      
      // Only show toast for non-server errors or if automations feature is actually being used
      if (!isServerError) {
        console.error('Error fetching automations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load automations',
          variant: 'destructive',
        });
      } else {
        // Silently handle server errors - might be that automations endpoint doesn't exist yet
        if (import.meta.env.DEV) {
          console.warn('Automations endpoint returned server error - feature might not be implemented:', errorMessage);
        }
      }
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, filterActive, searchTerm, toast]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await automationAPI.toggleAutomation(id, !currentStatus);
      if (response.success) {
        toast({
          title: 'Success',
          description: `Automation ${!currentStatus ? 'enabled' : 'disabled'}`,
        });
        fetchAutomations();
        onAutomationChange?.();
      } else {
        throw new Error(response.message || 'Failed to toggle automation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle automation',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await automationAPI.deleteAutomation(deletingId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Automation deleted',
        });
        setDeleteDialogOpen(false);
        setDeletingId(null);
        fetchAutomations();
        onAutomationChange?.();
      } else {
        throw new Error(response.message || 'Failed to delete automation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete automation',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setBuilderOpen(true);
  };

  const handleCreate = () => {
    setEditingAutomation(null);
    setBuilderOpen(true);
  };

  const handleViewLogs = async (automationId: string) => {
    setSelectedAutomationId(automationId);
    setExecutionLogsOpen(true);
    await fetchExecutionLogs(automationId);
  };

  const fetchExecutionLogs = async (automationId: string) => {
    try {
      setLoadingLogs(true);
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate with mock data structure
      // TODO: Implement backend endpoint /automations/:id/logs
      setExecutionLogs([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load execution logs',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDuplicate = async (automation: Automation) => {
    try {
      // Fetch full automation details to ensure we have all data
      const response = await automationAPI.getAutomationById(automation.id);
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch automation details');
      }

      const fullAutomation = response.data as Automation;
      
      // Create a duplicate with a modified name
      const duplicateName = `${fullAutomation.name} (Copy)`;
      
      const duplicateResponse = await automationAPI.createAutomation({
        boardId: boardId,
        name: duplicateName,
        trigger: fullAutomation.trigger,
        actions: fullAutomation.actions,
        conditions: fullAutomation.conditions,
        isActive: false, // Duplicates are inactive by default
      });

      if (duplicateResponse.success) {
        toast({
          title: 'Success',
          description: 'Automation duplicated successfully',
        });
        fetchAutomations();
        onAutomationChange?.();
      } else {
        throw new Error(duplicateResponse.message || 'Failed to duplicate automation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to duplicate automation',
        variant: 'destructive',
      });
    }
  };

  const getTriggerLabel = (trigger: Record<string, unknown>) => {
    const type = trigger.type as string;
    const triggerMap: Record<string, string> = {
      item_created: 'Item Created',
      item_updated: 'Item Updated',
      item_status_changed: 'Status Changed',
      item_deleted: 'Item Deleted',
      item_moved: 'Item Moved',
      field_changed: 'Field Changed',
      field_equals: 'Field Equals',
      field_greater_than: 'Field > Value',
      field_less_than: 'Field < Value',
      field_contains: 'Field Contains',
      field_is_empty: 'Field Is Empty',
      field_is_not_empty: 'Field Is Not Empty',
      date_approaching: 'Date Approaching',
      date_passed: 'Date Passed',
      date_equals_today: 'Date Equals Today',
      date_in_range: 'Date In Range',
      approval_submitted: 'Approval Submitted',
      approval_approved: 'Approval Approved',
      approval_rejected: 'Approval Rejected',
      approval_level_completed: 'Approval Level Completed',
    };
    return triggerMap[type] || type;
  };

  const getActionLabels = (actions: Array<Record<string, unknown>>) => {
    const actionMap: Record<string, string> = {
      change_status: 'Change Status',
      set_status: 'Set Status',
      update_field: 'Update Field',
      clear_field: 'Clear Field',
      calculate_formula: 'Calculate Formula',
      copy_field: 'Copy Field',
      assign_user: 'Assign User',
      send_notification: 'Send Notification',
      send_email: 'Send Email',
      notify_users: 'Notify Users',
      notify_assignees: 'Notify Assignees',
      create_item: 'Create Item',
      move_to_board: 'Move to Board',
      call_webhook: 'Call Webhook',
      api_call: 'API Call',
      create_external_task: 'Create External Task',
      update_external_system: 'Update External System',
    };
    return actions.map(action => actionMap[action.type as string] || action.type).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Automations ({automations.length})
            </CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search automations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterActive} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterActive(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchAutomations}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Automations Table */}
          {automations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold mb-2">No automations found</p>
              <p className="text-sm mb-4">
                {searchTerm || filterActive !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first automation to automate repetitive tasks'}
              </p>
              {!searchTerm && filterActive === 'all' && (
                <Button onClick={handleCreate} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Automation
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell className="font-medium">{automation.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTriggerLabel(automation.trigger)}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getActionLabels(automation.actions)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={automation.isActive}
                            onCheckedChange={() => handleToggle(automation.id, automation.isActive)}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <Badge
                            variant={automation.isActive ? 'default' : 'secondary'}
                            className={cn(
                              automation.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {automation.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(automation.updatedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggle(automation.id, automation.isActive)}>
                              {automation.isActive ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(automation)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewLogs(automation.id)}>
                              <Clock className="h-4 w-4 mr-2" />
                              View Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(automation)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingId(automation.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Builder */}
      <AutomationBuilder
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open);
          if (!open) {
            setEditingAutomation(null);
          }
        }}
        boardId={boardId}
        columns={columns}
        automation={editingAutomation}
        onSuccess={() => {
          fetchAutomations();
          onAutomationChange?.();
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this automation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Logs */}
      <Dialog open={executionLogsOpen} onOpenChange={setExecutionLogsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Execution Logs
            </DialogTitle>
            <DialogDescription>
              View execution history and errors for this automation
            </DialogDescription>
          </DialogHeader>
          
          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : executionLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold mb-2">No execution logs found</p>
              <p className="text-sm">This automation hasn't been executed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {executionLogs.map((log) => (
                <Card
                  key={log.id}
                  className={`p-4 ${
                    log.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : log.status === 'failed'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              log.status === 'success'
                                ? 'default'
                                : log.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {log.status.toUpperCase()}
                          </Badge>
                          {log.itemId && (
                            <span className="text-xs text-muted-foreground">
                              Item: {log.itemId.substring(0, 8)}...
                            </span>
                          )}
                          {log.executionTime && (
                            <span className="text-xs text-muted-foreground">
                              {log.executionTime}ms
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.executedAt), { addSuffix: true })}
                        </p>
                        {log.error && (
                          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm">
                            <p className="font-medium text-red-800">Error:</p>
                            <p className="text-red-700">{log.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecutionLogsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

