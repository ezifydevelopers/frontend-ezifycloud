import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Switch,
} from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Plus,
  Trash2,
  User,
  Save,
  AlertCircle,
  Info,
} from 'lucide-react';
import { ApprovalLevel } from '@/types/workspace';
import { workspaceAPI, workflowAPI, type ApprovalWorkflowConfig as WorkflowConfigType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ApprovalWorkflowConfig {
  boardId: string;
  enabled: boolean;
  levels: {
    level: ApprovalLevel;
    enabled: boolean;
    approverIds: string[];
    requireAll?: boolean; // For parallel approvals
    autoApprove?: boolean;
    autoApproveConditions?: {
      amountLessThan?: number;
      statusEquals?: string;
    };
    escalationDays?: number;
  }[];
  routingRules?: {
    amountBased?: {
      threshold: number;
      requiresLevels: ApprovalLevel[];
    }[];
    statusBased?: {
      status: string;
      requiresLevels: ApprovalLevel[];
    }[];
  };
}

interface ApprovalWorkflowSetupProps {
  boardId: string;
  workspaceId: string;
  onSave?: () => void;
}

const LEVEL_LABELS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'Level 1 (First Approval)',
  LEVEL_2: 'Level 2 (Second Approval)',
  LEVEL_3: 'Level 3 (Final Approval)',
};

export const ApprovalWorkflowSetup: React.FC<ApprovalWorkflowSetupProps> = ({
  boardId,
  workspaceId,
  onSave,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [config, setConfig] = useState<ApprovalWorkflowConfig>({
    boardId,
    enabled: false,
    levels: [
      {
        level: 'LEVEL_1',
        enabled: true,
        approverIds: [],
        requireAll: false,
        autoApprove: false,
      },
      {
        level: 'LEVEL_2',
        enabled: false,
        approverIds: [],
        requireAll: false,
        autoApprove: false,
      },
      {
        level: 'LEVEL_3',
        enabled: false,
        approverIds: [],
        requireAll: false,
        autoApprove: false,
      },
    ],
  });

  const fetchMembers = useCallback(async () => {
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
      toast({
        title: 'Error',
        description: 'Failed to fetch workspace members',
        variant: 'destructive',
      });
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchWorkflow();
    }
  }, [open, fetchMembers]);

  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      const response = await workflowAPI.getWorkflow(boardId);
      if (response.success && response.data) {
        // Convert API format to local format
        const apiConfig = response.data;
        setConfig({
          boardId,
          enabled: true,
          levels: apiConfig.levels.map((level) => ({
            level: level.level,
            enabled: true,
            approverIds: level.approvers,
            requireAll: level.isParallel,
            autoApprove: false,
            escalationDays: level.timeoutHours ? level.timeoutHours / 24 : undefined,
          })),
          routingRules: apiConfig.rules.length > 0 ? {
            amountBased: apiConfig.rules
              .filter(r => r.type === 'amount' && r.action.type === 'require_level')
              .map(r => ({
                threshold: Number(r.condition.value) || 0,
                requiresLevels: r.action.level ? [r.action.level] : [],
              })),
            statusBased: apiConfig.rules
              .filter(r => r.type === 'status' && r.action.type === 'require_level')
              .map(r => ({
                status: String(r.condition.value) || '',
                requiresLevels: r.action.level ? [r.action.level] : [],
              })),
          } : undefined,
        });
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      // Keep default config on error
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert local format to API format
      const apiConfig: WorkflowConfigType = {
        id: `workflow-${boardId}`,
        boardId,
        name: 'Approval Workflow',
        description: 'Multi-level approval workflow',
        isDefault: true,
        levels: config.levels
          .filter(l => l.enabled)
          .map(level => ({
            level: level.level,
            name: LEVEL_LABELS[level.level],
            approvers: level.approverIds,
            isOptional: false,
            isParallel: level.requireAll || false,
            requiredApprovals: level.requireAll ? level.approverIds.length : 1,
            timeoutHours: level.escalationDays ? level.escalationDays * 24 : undefined,
          })),
        rules: [
          // Amount-based rules
          ...(config.routingRules?.amountBased || []).map((rule, idx) => ({
            id: `rule-amount-${idx}`,
            name: `Amount > $${rule.threshold}`,
            type: 'amount' as const,
            condition: {
              operator: 'greater_than' as const,
              field: 'total',
              value: rule.threshold,
            },
            action: {
              type: 'require_level' as const,
              level: rule.requiresLevels[0] || 'LEVEL_1',
            },
            priority: 100 - idx,
            enabled: true,
          })),
          // Status-based rules
          ...(config.routingRules?.statusBased || []).map((rule, idx) => ({
            id: `rule-status-${idx}`,
            name: `Status = ${rule.status}`,
            type: 'status' as const,
            condition: {
              operator: 'equals' as const,
              field: 'status',
              value: rule.status,
            },
            action: {
              type: 'require_level' as const,
              level: rule.requiresLevels[0] || 'LEVEL_1',
            },
            priority: 50 - idx,
            enabled: true,
          })),
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await workflowAPI.saveWorkflow(boardId, apiConfig);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Approval workflow configuration saved',
        });
        setOpen(false);
        onSave?.();
      } else {
        throw new Error(response.message || 'Failed to save workflow');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save workflow configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateLevel = (levelIndex: number, updates: Partial<ApprovalWorkflowConfig['levels'][0]>) => {
    setConfig((prev) => ({
      ...prev,
      levels: prev.levels.map((level, idx) =>
        idx === levelIndex ? { ...level, ...updates } : level
      ),
    }));
  };

  const addApprover = (levelIndex: number, approverId: string) => {
    const level = config.levels[levelIndex];
    if (!level.approverIds.includes(approverId)) {
      updateLevel(levelIndex, {
        approverIds: [...level.approverIds, approverId],
      });
    }
  };

  const removeApprover = (levelIndex: number, approverId: string) => {
    const level = config.levels[levelIndex];
    updateLevel(levelIndex, {
      approverIds: level.approverIds.filter((id) => id !== approverId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure Approval Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Approval Workflow Configuration
          </DialogTitle>
          <DialogDescription>
            Configure multi-level approval workflow for this board. Set approvers, routing rules, and automation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Workflow */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Enable Approval Workflow</CardTitle>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>
            </CardHeader>
          </Card>

          {config.enabled && (
            <>
              {/* Approval Levels */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Approval Levels</h3>
                {config.levels.map((level, levelIndex) => (
                  <Card key={level.level} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={level.enabled}
                            onCheckedChange={(checked) =>
                              updateLevel(levelIndex, { enabled: checked })
                            }
                          />
                          <CardTitle className="text-base">{LEVEL_LABELS[level.level]}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    {level.enabled && (
                      <CardContent className="space-y-4">
                        {/* Approvers */}
                        <div className="space-y-2">
                          <Label>Approvers</Label>
                          <div className="flex flex-wrap gap-2">
                            {level.approverIds.map((approverId) => {
                              const approver = members.find((m) => m.id === approverId);
                              return (
                                <Badge key={approverId} variant="secondary" className="p-2">
                                  <User className="h-3 w-3 mr-1" />
                                  {approver?.name || approverId}
                                  <button
                                    onClick={() => removeApprover(levelIndex, approverId)}
                                    className="ml-2 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                            <Select
                              value=""
                              onValueChange={(value) => addApprover(levelIndex, value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Add approver" />
                              </SelectTrigger>
                              <SelectContent>
                                {members
                                  .filter((m) => !level.approverIds.includes(m.id))
                                  .map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      {member.name} ({member.email})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Parallel vs Sequential */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Approval Type</Label>
                            <p className="text-xs text-muted-foreground">
                              Require all approvers (parallel) or any approver (sequential)
                            </p>
                          </div>
                          <Switch
                            checked={level.requireAll}
                            onCheckedChange={(checked) =>
                              updateLevel(levelIndex, { requireAll: checked })
                            }
                          />
                          <Label className="text-xs">
                            {level.requireAll ? 'All Required' : 'Any Sufficient'}
                          </Label>
                        </div>

                        {/* Auto-approve */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-Approve</Label>
                            <p className="text-xs text-muted-foreground">
                              Automatically approve based on conditions
                            </p>
                          </div>
                          <Switch
                            checked={level.autoApprove || false}
                            onCheckedChange={(checked) =>
                              updateLevel(levelIndex, { autoApprove: checked })
                            }
                          />
                        </div>

                        {/* Auto-approve Conditions */}
                        {level.autoApprove && (
                          <div className="space-y-2 p-3 bg-slate-50 rounded-md">
                            <Label className="text-sm">Auto-Approve Conditions</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">If amount is less than:</Label>
                                <Input
                                  type="number"
                                  placeholder="1000"
                                  value={level.autoApproveConditions?.amountLessThan || ''}
                                  onChange={(e) =>
                                    updateLevel(levelIndex, {
                                      autoApproveConditions: {
                                        ...level.autoApproveConditions,
                                        amountLessThan: parseFloat(e.target.value) || undefined,
                                      },
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">If status equals:</Label>
                                <Input
                                  placeholder="draft"
                                  value={level.autoApproveConditions?.statusEquals || ''}
                                  onChange={(e) =>
                                    updateLevel(levelIndex, {
                                      autoApproveConditions: {
                                        ...level.autoApproveConditions,
                                        statusEquals: e.target.value || undefined,
                                      },
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Escalation */}
                        <div>
                          <Label>Escalation (days)</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Automatically escalate if not approved within this many days
                          </p>
                          <Input
                            type="number"
                            placeholder="3"
                            value={level.escalationDays || ''}
                            onChange={(e) =>
                              updateLevel(levelIndex, {
                                escalationDays: parseInt(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {/* Routing Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Routing Rules</h3>
                
                {/* Amount-based Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Amount-based Routing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.routingRules?.amountBased?.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                        <span className="text-sm">If amount {'>'} ${rule.threshold}, require:</span>
                        <Select
                          value={rule.requiresLevels[0] || 'LEVEL_1'}
                          onValueChange={(value) => {
                            const newRules = [...(config.routingRules?.amountBased || [])];
                            newRules[idx].requiresLevels = [value as ApprovalLevel];
                            setConfig(prev => ({
                              ...prev,
                              routingRules: {
                                ...prev.routingRules,
                                amountBased: newRules,
                              },
                            }));
                          }}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEVEL_1">Level 1</SelectItem>
                            <SelectItem value="LEVEL_2">Level 2</SelectItem>
                            <SelectItem value="LEVEL_3">Level 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={rule.threshold}
                          onChange={(e) => {
                            const newRules = [...(config.routingRules?.amountBased || [])];
                            newRules[idx].threshold = parseFloat(e.target.value) || 0;
                            setConfig(prev => ({
                              ...prev,
                              routingRules: {
                                ...prev.routingRules,
                                amountBased: newRules,
                              },
                            }));
                          }}
                          className="w-[120px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newRules = (config.routingRules?.amountBased || []).filter((_, i) => i !== idx);
                            setConfig(prev => ({
                              ...prev,
                              routingRules: {
                                ...prev.routingRules,
                                amountBased: newRules,
                              },
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No amount-based rules</p>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          routingRules: {
                            ...prev.routingRules,
                            amountBased: [
                              ...(prev.routingRules?.amountBased || []),
                              { threshold: 10000, requiresLevels: ['LEVEL_1'] },
                            ],
                          },
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Amount Rule
                    </Button>
                  </CardContent>
                </Card>

                {/* Status-based Rules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Status-based Routing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.routingRules?.statusBased?.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                        <span className="text-sm">If status =</span>
                        <Input
                          value={rule.status}
                          onChange={(e) => {
                            const newRules = [...(config.routingRules?.statusBased || [])];
                            newRules[idx].status = e.target.value;
                            setConfig(prev => ({
                              ...prev,
                              routingRules: {
                                ...prev.routingRules,
                                statusBased: newRules,
                              },
                            }));
                          }}
                          className="w-[150px]"
                          placeholder="e.g., draft"
                        />
                        <span className="text-sm">, require:</span>
                        <Select
                          value={rule.requiresLevels[0] || 'LEVEL_1'}
                          onValueChange={(value) => {
                            const newRules = [...(config.routingRules?.statusBased || [])];
                            newRules[idx].requiresLevels = [value as ApprovalLevel];
                            setConfig(prev => ({
                              ...prev,
                              routingRules: {
                                ...prev.routingRules,
                                statusBased: newRules,
                              },
                            }));
                          }}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEVEL_1">Level 1</SelectItem>
                            <SelectItem value="LEVEL_2">Level 2</SelectItem>
                            <SelectItem value="LEVEL_3">Level 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newRules = (config.routingRules?.statusBased || []).filter((_, i) => i !== idx);
                            setConfig(prev => ({
                              ...prev,
                              routingRules: {
                                ...prev.routingRules,
                                statusBased: newRules,
                              },
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No status-based rules</p>}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          routingRules: {
                            ...prev.routingRules,
                            statusBased: [
                              ...(prev.routingRules?.statusBased || []),
                              { status: '', requiresLevels: ['LEVEL_1'] },
                            ],
                          },
                        }));
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Status Rule
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !config.enabled}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

