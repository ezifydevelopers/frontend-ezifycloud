import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Save, X, Filter, ArrowUpDown, Group } from 'lucide-react';
import { reportAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ReportType } from '@prisma/client';
import { ReportConfig, ReportSchedule } from '@/types/report';

interface ReportBuilderProps {
  workspaceId?: string;
  boardId?: string;
  reportId?: string;
  onSave?: () => void;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  workspaceId,
  boardId,
  reportId,
  onSave,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ReportType>('custom');
  const [config, setConfig] = useState<ReportConfig>({
    columns: [],
    filters: {},
    sorting: [],
  });
  const [schedule, setSchedule] = useState<ReportSchedule | undefined>();

  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'invoice_summary', label: 'Invoice Summary' },
    { value: 'approval_status', label: 'Approval Status' },
    { value: 'payment_status', label: 'Payment Status' },
    { value: 'aging', label: 'Aging Report' },
    { value: 'custom', label: 'Custom Report' },
  ];

  const handleAddColumn = (column: string) => {
    if (!config.columns?.includes(column)) {
      setConfig({
        ...config,
        columns: [...(config.columns || []), column],
      });
    }
  };

  const handleRemoveColumn = (column: string) => {
    setConfig({
      ...config,
      columns: config.columns?.filter(c => c !== column),
    });
  };

  const handleAddSort = () => {
    setConfig({
      ...config,
      sorting: [...(config.sorting || []), { column: '', direction: 'asc' as const }],
    });
  };

  const handleUpdateSort = (index: number, updates: Partial<{ column: string; direction: 'asc' | 'desc' }>) => {
    const updated = [...(config.sorting || [])];
    updated[index] = { ...updated[index], ...updates };
    setConfig({ ...config, sorting: updated });
  };

  const handleRemoveSort = (index: number) => {
    setConfig({
      ...config,
      sorting: config.sorting?.filter((_, i) => i !== index),
    });
  };

  const handleSetGrouping = (column: string) => {
    setConfig({
      ...config,
      grouping: column
        ? {
            by: column,
            aggregations: [],
          }
        : undefined,
    });
  };

  const handleAddAggregation = () => {
    if (!config.grouping) return;
    setConfig({
      ...config,
      grouping: {
        ...config.grouping,
        aggregations: [...(config.grouping.aggregations || []), { column: '', function: 'sum' as const }],
      },
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Report name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      if (reportId) {
        await reportAPI.updateReport(reportId, {
          name,
          config,
          schedule,
        });
        toast({
          title: 'Success',
          description: 'Report updated successfully',
        });
      } else {
        await reportAPI.createReport({
          workspaceId,
          boardId,
          name,
          type,
          config,
          schedule,
        });
        toast({
          title: 'Success',
          description: 'Report created successfully',
        });
      }
      setOpen(false);
      onSave?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {reportId ? 'Edit Report' : 'Create Report'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reportId ? 'Edit Report' : 'Create Report'}</DialogTitle>
          <DialogDescription>
            Configure your report with columns, filters, grouping, and sorting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Report Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Report"
            />
          </div>

          {!reportId && (
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Columns */}
          <div className="space-y-2">
            <Label>Columns</Label>
            <div className="flex flex-wrap gap-2">
              {['name', 'board', 'status', 'createdAt', 'creator', 'amount', 'dueDate'].map((col) => (
                <div key={col} className="flex items-center gap-2">
                  <Checkbox
                    checked={config.columns?.includes(col)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleAddColumn(col);
                      } else {
                        handleRemoveColumn(col);
                      }
                    }}
                  />
                  <Label className="text-sm">{col}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date From</Label>
                  <Input
                    type="date"
                    value={config.filters?.dateRange?.from || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        filters: {
                          ...config.filters,
                          dateRange: {
                            ...config.filters?.dateRange,
                            from: e.target.value,
                          } as any,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Date To</Label>
                  <Input
                    type="date"
                    value={config.filters?.dateRange?.to || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        filters: {
                          ...config.filters,
                          dateRange: {
                            ...config.filters?.dateRange,
                            to: e.target.value,
                          } as any,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sorting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sorting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.sorting?.map((sort, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={sort.column}
                    onValueChange={(value) => handleUpdateSort(index, { column: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {config.columns?.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={sort.direction}
                    onValueChange={(value) => handleUpdateSort(index, { direction: value as 'asc' | 'desc' })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSort(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddSort}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sort
              </Button>
            </CardContent>
          </Card>

          {/* Grouping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Group className="h-4 w-4" />
                Grouping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={config.grouping?.by || ''}
                onValueChange={handleSetGrouping}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Group by column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Grouping</SelectItem>
                  {config.columns?.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {config.grouping && (
                <div className="space-y-2 mt-2">
                  <Label className="text-xs">Aggregations</Label>
                  {config.grouping.aggregations?.map((agg, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={agg.column}
                        onValueChange={(value) => {
                          const updated = [...(config.grouping!.aggregations || [])];
                          updated[index] = { ...updated[index], column: value };
                          setConfig({
                            ...config,
                            grouping: {
                              ...config.grouping!,
                              aggregations: updated,
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Column" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.columns?.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={agg.function}
                        onValueChange={(value) => {
                          const updated = [...(config.grouping!.aggregations || [])];
                          updated[index] = { ...updated[index], function: value as any };
                          setConfig({
                            ...config,
                            grouping: {
                              ...config.grouping!,
                              aggregations: updated,
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sum">Sum</SelectItem>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="min">Min</SelectItem>
                          <SelectItem value="max">Max</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = config.grouping!.aggregations?.filter((_, i) => i !== index);
                          setConfig({
                            ...config,
                            grouping: {
                              ...config.grouping!,
                              aggregations: updated,
                            },
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddAggregation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Aggregation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={schedule?.frequency || ''}
                onValueChange={(value) =>
                  setSchedule(
                    value
                      ? {
                          frequency: value as any,
                          emailRecipients: schedule?.emailRecipients || [],
                          format: schedule?.format || 'pdf',
                        }
                      : undefined
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No Schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Schedule</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
