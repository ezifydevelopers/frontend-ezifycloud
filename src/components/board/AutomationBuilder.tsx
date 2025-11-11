import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Zap,
  Plus,
  Trash2,
  Play,
  Save,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileText,
  X,
} from 'lucide-react';
import { automationAPI } from '@/lib/api';
import { Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AUTOMATION_TEMPLATES, AutomationTemplate } from '@/lib/automationTemplates';

interface AutomationBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  columns: Column[];
  automation?: {
    id: string;
    name: string;
    trigger: Record<string, unknown>;
    actions: Array<Record<string, unknown>>;
    conditions?: Record<string, unknown>;
    isActive: boolean;
  } | null;
  onSuccess?: () => void;
}

export interface TriggerConfig {
  type: string;
  config?: {
    columnId?: string;
    field?: string;
    operator?: string;
    value?: unknown;
    daysBefore?: number;
    level?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface ActionConfig {
  type: string;
  config?: {
    status?: string;
    columnId?: string;
    sourceColumnId?: string;
    field?: string;
    value?: unknown;
    formula?: string;
    userIds?: string[];
    email?: string;
    emails?: string[];
    subject?: string;
    message?: string;
    title?: string;
    webhookUrl?: string;
    webhookMethod?: string;
    apiUrl?: string;
    apiMethod?: string;
    targetBoardId?: string;
    itemName?: string;
    copyCells?: boolean;
    externalSystem?: string;
    externalTaskData?: Record<string, unknown>;
    externalUpdateData?: Record<string, unknown>;
  };
}

const TRIGGER_TYPES = [
  // Item Triggers
  { value: 'item_created', label: 'Item Created', icon: '➕', category: 'Item' },
  { value: 'item_updated', label: 'Item Updated', icon: '✏️', category: 'Item' },
  { value: 'item_status_changed', label: 'Status Changed', icon: '🔄', category: 'Item' },
  { value: 'item_deleted', label: 'Item Deleted', icon: '🗑️', category: 'Item' },
  { value: 'item_moved', label: 'Item Moved', icon: '➡️', category: 'Item' },
  
  // Field Triggers
  { value: 'field_changed', label: 'Field Changed', icon: '📝', category: 'Field' },
  { value: 'field_equals', label: 'Field Equals', icon: '=', category: 'Field' },
  { value: 'field_greater_than', label: 'Field > Value', icon: '>', category: 'Field' },
  { value: 'field_less_than', label: 'Field < Value', icon: '<', category: 'Field' },
  { value: 'field_contains', label: 'Field Contains', icon: '🔍', category: 'Field' },
  { value: 'field_is_empty', label: 'Field Is Empty', icon: '📭', category: 'Field' },
  { value: 'field_is_not_empty', label: 'Field Is Not Empty', icon: '📬', category: 'Field' },
  
  // Date Triggers
  { value: 'date_approaching', label: 'Date Approaching', icon: '📅', category: 'Date' },
  { value: 'date_passed', label: 'Date Passed', icon: '⏰', category: 'Date' },
  { value: 'date_equals_today', label: 'Date Equals Today', icon: '📆', category: 'Date' },
  { value: 'date_in_range', label: 'Date In Range', icon: '📊', category: 'Date' },
  
  // Approval Triggers
  { value: 'approval_submitted', label: 'Approval Submitted', icon: '📤', category: 'Approval' },
  { value: 'approval_approved', label: 'Approval Approved', icon: '✅', category: 'Approval' },
  { value: 'approval_rejected', label: 'Approval Rejected', icon: '❌', category: 'Approval' },
  { value: 'approval_level_completed', label: 'Approval Level Completed', icon: '✔️', category: 'Approval' },
];

const ACTION_TYPES = [
  // Status Actions
  { value: 'change_status', label: 'Change Status', icon: '🔄', category: 'Status' },
  { value: 'set_status', label: 'Set Status', icon: '🎯', category: 'Status' },
  { value: 'move_to_board', label: 'Move to Board', icon: '➡️', category: 'Status' },
  { value: 'create_item', label: 'Create Item', icon: '➕', category: 'Status' },
  
  // Field Actions
  { value: 'update_field', label: 'Update Field', icon: '📝', category: 'Field' },
  { value: 'clear_field', label: 'Clear Field', icon: '🗑️', category: 'Field' },
  { value: 'calculate_formula', label: 'Calculate Formula', icon: '🧮', category: 'Field' },
  { value: 'copy_field', label: 'Copy Field', icon: '📋', category: 'Field' },
  { value: 'assign_user', label: 'Assign User', icon: '👤', category: 'Field' },
  
  // Notification Actions
  { value: 'send_notification', label: 'Send Notification', icon: '🔔', category: 'Notification' },
  { value: 'send_email', label: 'Send Email', icon: '📧', category: 'Notification' },
  { value: 'notify_users', label: 'Notify Users', icon: '👥', category: 'Notification' },
  { value: 'notify_assignees', label: 'Notify Assignees', icon: '📢', category: 'Notification' },
  
  // Integration Actions
  { value: 'call_webhook', label: 'Call Webhook', icon: '🔗', category: 'Integration' },
  { value: 'api_call', label: 'API Call', icon: '🌐', category: 'Integration' },
  { value: 'create_external_task', label: 'Create External Task', icon: '📋', category: 'Integration' },
  { value: 'update_external_system', label: 'Update External System', icon: '🔄', category: 'Integration' },
];

export const AutomationBuilder: React.FC<AutomationBuilderProps> = ({
  open,
  onOpenChange,
  boardId,
  columns,
  automation,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [trigger, setTrigger] = useState<TriggerConfig>({
    type: 'item_created',
    config: {},
  });
  const [actions, setActions] = useState<ActionConfig[]>([]);
  const [conditions, setConditions] = useState<{
    type: 'and' | 'or';
    conditions: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
  }>({ type: 'and', conditions: [] });
  const [testResults, setTestResults] = useState<{
    success: boolean;
    preview?: Array<{
      type: string;
      description: string;
      config?: Record<string, unknown>;
      willExecute: boolean;
      reason?: string;
    }>;
    errors?: Array<{
      action: string;
      error: string;
    }>;
    executionTime?: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testItemId, setTestItemId] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);

  const isEditMode = !!automation;

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setIsActive(automation.isActive);
      setTrigger(automation.trigger as TriggerConfig);
      setActions((automation.actions as ActionConfig[]) || []);
      setConditions((automation.conditions as any) || { type: 'and', conditions: [] });
    } else {
      setName('');
      setIsActive(true);
      setTrigger({ type: 'item_created', config: {} });
      setActions([]);
      setConditions({ type: 'and', conditions: [] });
      setTestResults(null);
      setSelectedTemplate(null);
      setShowTemplates(false);
    }
  }, [automation, open]);

  const handleApplyTemplate = (template: AutomationTemplate) => {
    setName(template.name);
    setTrigger(template.trigger);
    setActions(template.actions);
    if (template.conditions) {
      setConditions(template.conditions);
    } else {
      setConditions({ type: 'and', conditions: [] });
    }
    setSelectedTemplate(template);
    setShowTemplates(false);
    toast({
      title: 'Template Applied',
      description: `${template.name} has been loaded. Please configure the required fields.`,
    });
  };

  const handleAddAction = () => {
    setActions([...actions, { type: 'change_status', config: {} }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleUpdateAction = (index: number, updates: Partial<ActionConfig>) => {
    setActions(actions.map((action, i) => i === index ? { ...action, ...updates } : action));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Automation name is required',
        variant: 'destructive',
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one action is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const data = {
        boardId,
        name: name.trim(),
        trigger,
        actions,
        conditions: conditions.conditions.length > 0 ? conditions : undefined,
        isActive,
      };

      let response;
      if (isEditMode && automation) {
        response = await automationAPI.updateAutomation(automation.id, data);
      } else {
        response = await automationAPI.createAutomation(data);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: `Automation ${isEditMode ? 'updated' : 'created'} successfully`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(response.message || 'Failed to save automation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save automation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    // Validate automation configuration
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an automation name before testing',
        variant: 'destructive',
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one action before testing',
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(true);
      setTestResults(null);

      const startTime = Date.now();
      
      // Validate trigger configuration
      const triggerErrors: string[] = [];
      if (trigger.type.startsWith('field_') && !trigger.config?.columnId) {
        triggerErrors.push('Field trigger requires a column selection');
      }
      if (trigger.type === 'date_approaching' && !trigger.config?.daysBefore) {
        triggerErrors.push('Date approaching trigger requires days before value');
      }
      if (trigger.type === 'date_in_range' && (!trigger.config?.startDate || !trigger.config?.endDate)) {
        triggerErrors.push('Date in range trigger requires both start and end dates');
      }

      // Validate actions
      const actionErrors: Array<{ action: string; error: string }> = [];
      const actionPreviews: Array<{
        type: string;
        description: string;
        config?: Record<string, unknown>;
        willExecute: boolean;
        reason?: string;
      }> = [];

      actions.forEach((action, index) => {
        const actionLabel = ACTION_TYPES.find(a => a.value === action.type)?.label || action.type;
        let willExecute = true;
        let reason = '';

        // Validate action-specific requirements
        switch (action.type) {
          case 'change_status':
          case 'set_status':
            if (!action.config?.status) {
              willExecute = false;
              reason = 'Missing status value';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'Status value is required' });
            }
            break;
          case 'update_field':
            if (!action.config?.columnId) {
              willExecute = false;
              reason = 'Missing column selection';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'Column selection is required' });
            }
            break;
          case 'move_to_board':
          case 'create_item':
            if (!action.config?.targetBoardId) {
              willExecute = false;
              reason = 'Missing target board ID';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'Target board ID is required' });
            }
            break;
          case 'send_email':
            if (!action.config?.email && (!action.config?.emails || (action.config.emails as string[]).length === 0)) {
              willExecute = false;
              reason = 'Missing email address';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'Email address is required' });
            }
            break;
          case 'call_webhook':
            if (!action.config?.webhookUrl) {
              willExecute = false;
              reason = 'Missing webhook URL';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'Webhook URL is required' });
            }
            break;
          case 'api_call':
            if (!action.config?.apiUrl) {
              willExecute = false;
              reason = 'Missing API URL';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'API URL is required' });
            }
            break;
          case 'calculate_formula':
            if (!action.config?.formula || !action.config?.columnId) {
              willExecute = false;
              reason = 'Missing formula or target column';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'Formula and target column are required' });
            }
            break;
          case 'copy_field':
            if (!action.config?.sourceColumnId || !action.config?.columnId) {
              willExecute = false;
              reason = 'Missing source or target column';
              actionErrors.push({ action: `Action ${index + 1} (${actionLabel})`, error: 'Source and target columns are required' });
            }
            break;
        }

        // Generate preview description
        let description = '';
        switch (action.type) {
          case 'change_status':
          case 'set_status':
            description = `Set item status to "${action.config?.status || 'N/A'}"`;
            break;
          case 'update_field':
            const column = columns.find(c => c.id === action.config?.columnId);
            description = `Update field "${column?.name || 'N/A'}" to "${action.config?.value || 'N/A'}"`;
            break;
          case 'clear_field':
            const clearColumn = columns.find(c => c.id === action.config?.columnId);
            description = `Clear field "${clearColumn?.name || 'N/A'}"`;
            break;
          case 'move_to_board':
            description = `Move item to board "${action.config?.targetBoardId || 'N/A'}"`;
            break;
          case 'create_item':
            description = `Create new item in board "${action.config?.targetBoardId || 'N/A'}"${action.config?.itemName ? ` named "${action.config.itemName}"` : ''}`;
            break;
          case 'send_email':
            description = `Send email to "${action.config?.email || action.config?.emails || 'N/A'}" with subject "${action.config?.subject || 'N/A'}"`;
            break;
          case 'send_notification':
          case 'notify_users':
            description = `Send notification "${action.config?.title || 'N/A'}" to ${Array.isArray(action.config?.userIds) ? action.config.userIds.length : 0} user(s)`;
            break;
          case 'notify_assignees':
            description = `Send notification "${action.config?.title || 'N/A'}" to all assignees`;
            break;
          case 'call_webhook':
            description = `Call webhook "${action.config?.webhookUrl || 'N/A'}" using ${action.config?.webhookMethod || 'POST'} method`;
            break;
          case 'api_call':
            description = `Call API "${action.config?.apiUrl || 'N/A'}" using ${action.config?.apiMethod || 'POST'} method`;
            break;
          case 'calculate_formula':
            description = `Calculate formula "${action.config?.formula || 'N/A'}" and store in target column`;
            break;
          case 'copy_field':
            const sourceCol = columns.find(c => c.id === action.config?.sourceColumnId);
            const targetCol = columns.find(c => c.id === action.config?.columnId);
            description = `Copy value from "${sourceCol?.name || 'N/A'}" to "${targetCol?.name || 'N/A'}"`;
            break;
          default:
            description = `Execute ${actionLabel}`;
        }

        actionPreviews.push({
          type: action.type,
          description,
          config: action.config,
          willExecute,
          reason: willExecute ? undefined : reason,
        });
      });

      const executionTime = Date.now() - startTime;

      // If there's an existing automation, try to test it with backend
      if (automation?.id && testItemId) {
        try {
          const response = await automationAPI.testAutomation(automation.id, testItemId);
          if (response.success && response.data) {
            const backendData = response.data as { preview?: unknown[] };
            // Merge backend preview with our validation
            if (backendData.preview) {
              actionPreviews.forEach((preview, index) => {
                if (backendData.preview && Array.isArray(backendData.preview) && backendData.preview[index]) {
                  const backendPreview = backendData.preview[index] as { description?: string };
                  if (backendPreview.description) {
                    preview.description = backendPreview.description;
                  }
                }
              });
            }
          }
        } catch (backendError) {
          // Backend test failed, but we still have our validation results
          console.warn('Backend test failed:', backendError);
        }
      }

      setTestResults({
        success: triggerErrors.length === 0 && actionErrors.length === 0,
        preview: actionPreviews,
        errors: triggerErrors.length > 0 ? [
          ...triggerErrors.map(err => ({ action: 'Trigger', error: err })),
          ...actionErrors,
        ] : actionErrors,
        executionTime,
      });

      if (triggerErrors.length > 0 || actionErrors.length > 0) {
        toast({
          title: 'Test Complete with Errors',
          description: `Found ${triggerErrors.length + actionErrors.length} error(s). Check the preview for details.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Test Complete',
          description: 'Automation configuration is valid and ready to execute',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test automation',
        variant: 'destructive',
      });
      setTestResults({
        success: false,
        errors: [{ action: 'Test Execution', error: error instanceof Error ? error.message : 'Unknown error' }],
      });
    } finally {
      setTesting(false);
    }
  };

  const renderTriggerConfig = () => {
    const fieldTriggers = ['field_changed', 'field_equals', 'field_greater_than', 'field_less_than', 'field_contains', 'field_is_empty', 'field_is_not_empty'];
    const dateTriggers = ['date_approaching', 'date_passed', 'date_equals_today', 'date_in_range'];
    const approvalTriggers = ['approval_submitted', 'approval_approved', 'approval_rejected', 'approval_level_completed'];
    
    const needsColumn = fieldTriggers.includes(trigger.type) || dateTriggers.includes(trigger.type);
    const needsOperator = ['field_equals', 'field_greater_than', 'field_less_than', 'field_contains'].includes(trigger.type);
    const needsValue = ['field_equals', 'field_greater_than', 'field_less_than', 'field_contains'].includes(trigger.type) && trigger.config?.operator !== 'is_empty' && trigger.config?.operator !== 'is_not_empty';
    const needsDaysBefore = trigger.type === 'date_approaching';
    const needsLevel = approvalTriggers.includes(trigger.type);
    const needsDateRange = trigger.type === 'date_in_range';
    const needsStatusValue = trigger.type === 'item_status_changed';

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Trigger Type</Label>
          <Select
            value={trigger.type}
            onValueChange={(value) => setTrigger({ ...trigger, type: value, config: {} })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(
                TRIGGER_TYPES.reduce((acc, type) => {
                  if (!acc[type.category!]) acc[type.category!] = [];
                  acc[type.category!].push(type);
                  return acc;
                }, {} as Record<string, typeof TRIGGER_TYPES>)
              ).map(([category, types]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {types.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsColumn && (
          <div className="space-y-2">
            <Label>Column</Label>
            <Select
              value={trigger.config?.columnId || ''}
              onValueChange={(value) =>
                setTrigger({ ...trigger, config: { ...trigger.config, columnId: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(col => !col.isHidden).map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {needsOperator && (
          <div className="space-y-2">
            <Label>Operator</Label>
            <Select
              value={trigger.config?.operator || 'equals'}
              onValueChange={(value) =>
                setTrigger({ ...trigger, config: { ...trigger.config, operator: value } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Not Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="greater_than">Greater Than</SelectItem>
                <SelectItem value="less_than">Less Than</SelectItem>
                <SelectItem value="is_empty">Is Empty</SelectItem>
                <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {needsStatusValue && (
          <div className="space-y-2">
            <Label>Status Value (Optional)</Label>
            <Input
              value={String(trigger.config?.value || '')}
              onChange={(e) =>
                setTrigger({ ...trigger, config: { ...trigger.config, value: e.target.value } })
              }
              placeholder="Leave empty to trigger on any status change"
            />
            <p className="text-xs text-muted-foreground">
              If specified, only triggers when status changes to this value
            </p>
          </div>
        )}

        {needsDateRange && (
          <>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={trigger.config?.startDate ? String(trigger.config.startDate).split('T')[0] : ''}
                onChange={(e) =>
                  setTrigger({
                    ...trigger,
                    config: { ...trigger.config, startDate: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={trigger.config?.endDate ? String(trigger.config.endDate).split('T')[0] : ''}
                onChange={(e) =>
                  setTrigger({
                    ...trigger,
                    config: { ...trigger.config, endDate: e.target.value },
                  })
                }
              />
            </div>
          </>
        )}

        {trigger.type === 'date_equals_today' && (
          <div className="space-y-2">
            <Label>Date Column</Label>
            <Select
              value={trigger.config?.columnId || ''}
              onValueChange={(value) =>
                setTrigger({ ...trigger, config: { ...trigger.config, columnId: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date column" />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(col => ['DATE', 'DATETIME'].includes(col.type) && !col.isHidden).map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {trigger.type === 'date_passed' && (
          <div className="space-y-2">
            <Label>Date Column</Label>
            <Select
              value={trigger.config?.columnId || ''}
              onValueChange={(value) =>
                setTrigger({ ...trigger, config: { ...trigger.config, columnId: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date column" />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(col => ['DATE', 'DATETIME'].includes(col.type) && !col.isHidden).map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(trigger.type === 'field_is_empty' || trigger.type === 'field_is_not_empty') && (
          <div className="space-y-2">
            <Label>Column</Label>
            <Select
              value={trigger.config?.columnId || ''}
              onValueChange={(value) =>
                setTrigger({ ...trigger, config: { ...trigger.config, columnId: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(col => !col.isHidden).map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {trigger.type === 'field_contains' && (
          <div className="space-y-2">
            <Label>Column</Label>
            <Select
              value={trigger.config?.columnId || ''}
              onValueChange={(value) =>
                setTrigger({ ...trigger, config: { ...trigger.config, columnId: value } })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(col => !col.isHidden).map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2 mt-2">
              <Label>Contains Value</Label>
              <Input
                value={String(trigger.config?.value || '')}
                onChange={(e) =>
                  setTrigger({ ...trigger, config: { ...trigger.config, value: e.target.value } })
                }
                placeholder="Text to search for"
              />
            </div>
          </div>
        )}

        {needsValue && trigger.config?.operator !== 'is_empty' && trigger.config?.operator !== 'is_not_empty' && (
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={String(trigger.config?.value || '')}
              onChange={(e) =>
                setTrigger({ ...trigger, config: { ...trigger.config, value: e.target.value } })
              }
              placeholder="Enter value to match"
            />
          </div>
        )}

        {needsDaysBefore && (
          <div className="space-y-2">
            <Label>Days Before</Label>
            <Input
              type="number"
              value={trigger.config?.daysBefore || ''}
              onChange={(e) =>
                setTrigger({
                  ...trigger,
                  config: { ...trigger.config, daysBefore: parseInt(e.target.value) || undefined },
                })
              }
              placeholder="e.g., 3"
            />
            <p className="text-xs text-muted-foreground">Trigger this many days before the date</p>
          </div>
        )}

        {needsLevel && (
          <div className="space-y-2">
            <Label>Approval Level</Label>
            <Select
              value={trigger.config?.level || 'LEVEL_1'}
              onValueChange={(value) =>
                setTrigger({ ...trigger, config: { ...trigger.config, level: value } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEVEL_1">Level 1</SelectItem>
                <SelectItem value="LEVEL_2">Level 2</SelectItem>
                <SelectItem value="LEVEL_3">Level 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  const renderActionConfig = (action: ActionConfig, index: number) => {
    return (
      <Card key={index} className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Action {index + 1}</Badge>
            <Select
              value={action.type}
              onValueChange={(value) => handleUpdateAction(index, { type: value, config: {} })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  ACTION_TYPES.reduce((acc, type) => {
                    if (!acc[type.category!]) acc[type.category!] = [];
                    acc[type.category!].push(type);
                    return acc;
                  }, {} as Record<string, typeof ACTION_TYPES>)
                ).map(([category, types]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {types.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveAction(index)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Action-specific configuration */}
        {(action.type === 'change_status' || action.type === 'set_status') && (
          <div className="space-y-2">
            <Label>New Status</Label>
            <Input
              value={String(action.config?.status || '')}
              onChange={(e) =>
                handleUpdateAction(index, {
                  config: { ...action.config, status: e.target.value },
                })
              }
              placeholder="Enter status value"
            />
          </div>
        )}

        {action.type === 'move_to_board' && (
          <div className="space-y-2">
            <Label>Target Board ID</Label>
            <Input
              value={String(action.config?.targetBoardId || '')}
              onChange={(e) =>
                handleUpdateAction(index, {
                  config: { ...action.config, targetBoardId: e.target.value },
                })
              }
              placeholder="Board ID to move item to"
            />
          </div>
        )}

        {action.type === 'update_field' && (
          <>
            <div className="space-y-2">
              <Label>Column</Label>
              <Select
                value={action.config?.columnId || ''}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, columnId: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(col => !col.isHidden).map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                value={String(action.config?.value || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, value: e.target.value },
                  })
                }
                placeholder="Enter value"
              />
            </div>
          </>
        )}

        {action.type === 'assign_user' && (
          <div className="space-y-2">
            <Label>Column (People type)</Label>
            <Select
              value={action.config?.columnId || ''}
              onValueChange={(value) =>
                handleUpdateAction(index, {
                  config: { ...action.config, columnId: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select PEOPLE column" />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(col => col.type === 'PEOPLE' && !col.isHidden).map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Note: User IDs would typically be selected from a multi-select component
            </p>
          </div>
        )}

        {action.type === 'send_email' && (
          <>
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={String(action.config?.email || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, email: e.target.value },
                  })
                }
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={String(action.config?.subject || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, subject: e.target.value },
                  })
                }
                placeholder="Email subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={String(action.config?.message || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, message: e.target.value },
                  })
                }
                placeholder="Email message"
                rows={3}
              />
            </div>
          </>
        )}

        {action.type === 'call_webhook' && (
          <>
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                value={String(action.config?.webhookUrl || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, webhookUrl: e.target.value },
                  })
                }
                placeholder="https://api.example.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>HTTP Method</Label>
              <Select
                value={action.config?.webhookMethod || 'POST'}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, webhookMethod: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {action.type === 'create_item' && (
          <>
            <div className="space-y-2">
              <Label>Target Board ID</Label>
              <Input
                value={String(action.config?.targetBoardId || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, targetBoardId: e.target.value },
                  })
                }
                placeholder="Board ID to create item in"
              />
            </div>
            <div className="space-y-2">
              <Label>Item Name (Optional)</Label>
              <Input
                value={String(action.config?.itemName || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, itemName: e.target.value },
                  })
                }
                placeholder="Leave empty for default name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={action.config?.copyCells === true}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, copyCells: e.target.checked },
                  })
                }
                className="rounded"
              />
              <Label className="text-sm">Copy cells from source item</Label>
            </div>
          </>
        )}

        {action.type === 'clear_field' && (
          <div className="space-y-2">
            <Label>Column to Clear</Label>
            <Select
              value={action.config?.columnId || ''}
              onValueChange={(value) =>
                handleUpdateAction(index, {
                  config: { ...action.config, columnId: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.filter(col => !col.isHidden).map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {action.type === 'calculate_formula' && (
          <>
            <div className="space-y-2">
              <Label>Target Column</Label>
              <Select
                value={action.config?.columnId || ''}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, columnId: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column to store result" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(col => !col.isHidden).map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formula</Label>
              <Input
                value={String(action.config?.formula || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, formula: e.target.value },
                  })
                }
                placeholder="e.g., {amount} * 1.1 or {price} + {tax}"
              />
              <p className="text-xs text-muted-foreground">
                Use {'{fieldName}'} to reference field values
              </p>
            </div>
          </>
        )}

        {action.type === 'copy_field' && (
          <>
            <div className="space-y-2">
              <Label>Source Column</Label>
              <Select
                value={action.config?.sourceColumnId || ''}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, sourceColumnId: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(col => !col.isHidden).map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Column</Label>
              <Select
                value={action.config?.columnId || ''}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, columnId: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(col => !col.isHidden).map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {action.type === 'send_notification' && (
          <>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={String(action.config?.title || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, title: e.target.value },
                  })
                }
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={String(action.config?.message || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, message: e.target.value },
                  })
                }
                placeholder="Notification message"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>User IDs (comma-separated)</Label>
              <Input
                value={Array.isArray(action.config?.userIds) ? action.config.userIds.join(', ') : String(action.config?.userIds || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      userIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean),
                    },
                  })
                }
                placeholder="user-id-1, user-id-2"
              />
            </div>
          </>
        )}

        {action.type === 'notify_users' && (
          <>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={String(action.config?.title || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, title: e.target.value },
                  })
                }
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={String(action.config?.message || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, message: e.target.value },
                  })
                }
                placeholder="Notification message"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>User IDs (comma-separated)</Label>
              <Input
                value={Array.isArray(action.config?.userIds) ? action.config.userIds.join(', ') : String(action.config?.userIds || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: {
                      ...action.config,
                      userIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean),
                    },
                  })
                }
                placeholder="user-id-1, user-id-2"
              />
            </div>
          </>
        )}

        {action.type === 'notify_assignees' && (
          <>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={String(action.config?.title || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, title: e.target.value },
                  })
                }
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={String(action.config?.message || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, message: e.target.value },
                  })
                }
                placeholder="Notification message"
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Will automatically notify all users assigned to this item
            </p>
          </>
        )}

        {action.type === 'api_call' && (
          <>
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input
                value={String(action.config?.apiUrl || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, apiUrl: e.target.value },
                  })
                }
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div className="space-y-2">
              <Label>HTTP Method</Label>
              <Select
                value={action.config?.apiMethod || 'POST'}
                onValueChange={(value) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, apiMethod: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {action.type === 'create_external_task' && (
          <>
            <div className="space-y-2">
              <Label>External System</Label>
              <Input
                value={String(action.config?.externalSystem || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, externalSystem: e.target.value },
                  })
                }
                placeholder="e.g., jira, asana, trello"
              />
            </div>
            <div className="space-y-2">
              <Label>Task Data (JSON)</Label>
              <Textarea
                value={JSON.stringify(action.config?.externalTaskData || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleUpdateAction(index, {
                      config: { ...action.config, externalTaskData: parsed },
                    });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"title": "Task", "description": "..."}'
                rows={4}
              />
            </div>
          </>
        )}

        {action.type === 'update_external_system' && (
          <>
            <div className="space-y-2">
              <Label>External System</Label>
              <Input
                value={String(action.config?.externalSystem || '')}
                onChange={(e) =>
                  handleUpdateAction(index, {
                    config: { ...action.config, externalSystem: e.target.value },
                  })
                }
                placeholder="e.g., jira, asana, trello"
              />
            </div>
            <div className="space-y-2">
              <Label>Update Data (JSON)</Label>
              <Textarea
                value={JSON.stringify(action.config?.externalUpdateData || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleUpdateAction(index, {
                      config: { ...action.config, externalUpdateData: parsed },
                    });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"status": "done", "assignee": "..."}'
                rows={4}
              />
            </div>
          </>
        )}
      </Card>
    );
  };

  const renderConditionBuilder = () => {
    const handleAddCondition = () => {
      setConditions({
        ...conditions,
        conditions: [...conditions.conditions, { field: '', operator: 'equals', value: '' }],
      });
    };

    const handleRemoveCondition = (index: number) => {
      setConditions({
        ...conditions,
        conditions: conditions.conditions.filter((_, i) => i !== index),
      });
    };

    const handleUpdateCondition = (index: number, updates: Partial<typeof conditions.conditions[0]>) => {
      setConditions({
        ...conditions,
        conditions: conditions.conditions.map((cond, i) =>
          i === index ? { ...cond, ...updates } : cond
        ),
      });
    };

    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">Additional Conditions</Label>
            <Select
              value={conditions.type}
              onValueChange={(value: 'and' | 'or') =>
                setConditions({ ...conditions, type: value })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="and">AND</SelectItem>
                <SelectItem value="or">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            disabled={conditions.conditions.length >= 10}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        </div>

        {conditions.conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No additional conditions. Actions will execute when trigger matches.
          </p>
        ) : (
          <div className="space-y-3">
            {conditions.conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                <span className="text-sm font-medium text-muted-foreground w-8">
                  {index + 1}
                </span>
                <Select
                  value={condition.field || ''}
                  onValueChange={(value) => handleUpdateCondition(index, { field: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    {columns.filter(col => !col.isHidden).map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={condition.operator || 'equals'}
                  onValueChange={(value) => handleUpdateCondition(index, { operator: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                    <SelectItem value="is_empty">Is Empty</SelectItem>
                    <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                  </SelectContent>
                </Select>
                {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
                  <Input
                    className="flex-1"
                    value={String(condition.value || '')}
                    onChange={(e) => handleUpdateCondition(index, { value: e.target.value })}
                    placeholder="Value"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCondition(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            {isEditMode ? 'Edit Automation' : 'Create Automation'}
          </DialogTitle>
          <DialogDescription>
            Build automation rules that trigger actions when specific events occur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Selector */}
          {!isEditMode && !selectedTemplate && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Start with a Template</h3>
                  <p className="text-sm text-blue-700">
                    Choose from pre-built automation templates to get started quickly
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="border-blue-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {showTemplates ? 'Hide Templates' : 'Browse Templates'}
                </Button>
              </div>

              {showTemplates && (
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(
                    AUTOMATION_TEMPLATES.reduce((acc, template) => {
                      if (!acc[template.category]) acc[template.category] = [];
                      acc[template.category].push(template);
                      return acc;
                    }, {} as Record<string, AutomationTemplate[]>)
                  ).map(([category, templates]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-sm text-blue-900 mb-2">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {templates.map((template) => (
                          <Card
                            key={template.id}
                            className="p-3 cursor-pointer hover:bg-blue-100 transition-colors border-blue-200"
                            onClick={() => handleApplyTemplate(template)}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-2xl">{template.icon}</span>
                              <div className="flex-1">
                                <h5 className="font-semibold text-sm">{template.name}</h5>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {template.description}
                                </p>
                                {template.requiredColumns && template.requiredColumns.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-blue-700">Requires:</p>
                                    <ul className="text-xs text-blue-600 mt-1">
                                      {template.requiredColumns.map((col, idx) => (
                                        <li key={idx}>• {col.name} ({col.type})</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Selected Template Info */}
          {selectedTemplate && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-green-900">Using Template: {selectedTemplate.name}</h3>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {selectedTemplate.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-green-700 mb-2">{selectedTemplate.description}</p>
                    {selectedTemplate.notes && selectedTemplate.notes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-green-800 mb-1">Important Notes:</p>
                        <ul className="text-xs text-green-700 space-y-1">
                          {selectedTemplate.notes.map((note, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setName('');
                    setTrigger({ type: 'item_created', config: {} });
                    setActions([]);
                    setConditions({ type: 'and', conditions: [] });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Automation Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Auto-assign high-value items"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Automation is active
              </Label>
            </div>
          </div>

          {/* Trigger */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">When (Trigger)</h3>
            </div>
            {renderTriggerConfig()}
          </div>

          {/* Conditions */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">If (Conditions)</h3>
            </div>
            {renderConditionBuilder()}
          </div>

          {/* Actions */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Then (Actions)</h3>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddAction}>
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border-2 border-dashed">
                <p>No actions configured</p>
                <p className="text-xs mt-1">Add at least one action to execute when trigger occurs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div className="absolute -top-2 left-6 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs z-10">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                    {renderActionConfig(action, index)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="border-t pt-4">
              <div className={`rounded-lg p-4 ${
                testResults.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${
                    testResults.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Test Results
                  </h4>
                  {testResults.executionTime && (
                    <span className="text-xs text-muted-foreground">
                      Executed in {testResults.executionTime}ms
                    </span>
                  )}
                </div>

                {testResults.errors && testResults.errors.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-red-800 mb-2 text-sm">Errors Found:</h5>
                    <div className="space-y-1">
                      {testResults.errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-red-800">{error.action}:</span>
                            <span className="text-red-700 ml-1">{error.error}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.preview && testResults.preview.length > 0 && (
                  <div>
                    <h5 className={`font-semibold mb-2 text-sm ${
                      testResults.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Action Preview:
                    </h5>
                    <div className="space-y-2">
                      {testResults.preview.map((action, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded border ${
                            action.willExecute
                              ? 'bg-white border-green-200'
                              : 'bg-gray-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={action.willExecute ? 'default' : 'destructive'}>
                                  Action {index + 1}
                                </Badge>
                                <span className="text-sm font-medium">{ACTION_TYPES.find(a => a.value === action.type)?.label || action.type}</span>
                                {action.willExecute ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                              {action.reason && (
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ {action.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.success && testResults.preview && testResults.preview.every(p => p.willExecute) && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-green-800 font-medium">
                      All actions are configured correctly and will execute when triggered.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={loading || testing || !name.trim() || actions.length === 0}
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test Rule
                  </>
                )}
              </Button>
              {isEditMode && automation?.id && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Test with Item ID:</Label>
                  <Input
                    type="text"
                    placeholder="Item ID (optional)"
                    value={testItemId}
                    onChange={(e) => setTestItemId(e.target.value)}
                    className="w-32 h-8 text-xs"
                    disabled={testing}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => {
                setTestResults(null);
                onOpenChange(false);
              }} disabled={loading || testing}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading || testing || !name.trim() || actions.length === 0}>
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update' : 'Create'} Automation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

