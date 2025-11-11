import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Save,
  X,
  GripVertical,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Gauge,
  Table,
  Activity,
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { WidgetConfig } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface EnhancedDashboardBuilderProps {
  workspaceId: string;
  boardId?: string;
  dashboardId?: string;
  onSave?: () => void;
}

const WIDGET_TYPES = [
  { value: 'kpi_card', label: 'KPI Card', icon: Activity },
  { value: 'bar_chart', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line_chart', label: 'Line Chart', icon: LineChart },
  { value: 'pie_chart', label: 'Pie Chart', icon: PieChart },
  { value: 'area_chart', label: 'Area Chart', icon: TrendingUp },
  { value: 'gauge_chart', label: 'Gauge Chart', icon: Gauge },
  { value: 'summary_table', label: 'Summary Table', icon: Table },
  { value: 'trend_line', label: 'Trend Line', icon: TrendingUp },
  { value: 'status_distribution', label: 'Status Distribution', icon: Activity },
] as const;

export const EnhancedDashboardBuilder: React.FC<EnhancedDashboardBuilderProps> = ({
  workspaceId,
  boardId,
  dashboardId,
  onSave,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [draggedWidget, setDraggedWidget] = useState<number | null>(null);
  const [editingWidget, setEditingWidget] = useState<number | null>(null);

  // Load existing dashboard if editing
  useEffect(() => {
    if (dashboardId) {
      loadDashboard();
    }
  }, [dashboardId]);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getDashboardById(dashboardId!);
      if (response.success && response.data) {
        const dashboard = response.data as any;
        setName(dashboard.name || '');
        setDescription(dashboard.description || '');
        setWidgets((dashboard.widgets || []) as WidgetConfig[]);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const handleAddWidget = (type: string) => {
    const newWidget: WidgetConfig = {
      type: type as WidgetConfig['type'],
      title: `New ${WIDGET_TYPES.find(w => w.value === type)?.label || 'Widget'}`,
      dataSource: {
        type: boardId ? 'board' : 'workspace',
        boardId,
        aggregation: 'count',
      },
      position: {
        x: (widgets.length % 3) * 4,
        y: Math.floor(widgets.length / 3) * 3,
        w: 4,
        h: 3,
      },
    };
    setWidgets([...widgets, newWidget]);
    setEditingWidget(widgets.length);
  };

  const handleRemoveWidget = (index: number) => {
    setWidgets(widgets.filter((_, i) => i !== index));
  };

  const handleUpdateWidget = (index: number, updates: Partial<WidgetConfig>) => {
    const updated = [...widgets];
    updated[index] = { ...updated[index], ...updates };
    setWidgets(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedWidget(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedWidget === null || draggedWidget === index) return;

    const newWidgets = [...widgets];
    const dragged = newWidgets[draggedWidget];
    newWidgets.splice(draggedWidget, 1);
    newWidgets.splice(index, 0, dragged);
    setWidgets(newWidgets);
    setDraggedWidget(index);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Dashboard name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      if (dashboardId) {
        await dashboardAPI.updateDashboard(dashboardId, {
          name,
          description,
          widgets,
        });
        toast({
          title: 'Success',
          description: 'Dashboard updated successfully',
        });
      } else {
        await dashboardAPI.createDashboard({
          workspaceId,
          name,
          description,
          widgets,
          isPublic: false,
        });
        toast({
          title: 'Success',
          description: 'Dashboard created successfully',
        });
      }
      setOpen(false);
      onSave?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save dashboard',
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
          {dashboardId ? 'Edit Dashboard' : 'Create Dashboard'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dashboardId ? 'Edit Dashboard' : 'Create Dashboard'}</DialogTitle>
          <DialogDescription>
            Build a custom dashboard by adding and arranging widgets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dashboard Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Dashboard Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Dashboard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dashboard description..."
              rows={2}
            />
          </div>

          {/* Add Widgets */}
          <div className="space-y-2">
            <Label>Add Widgets</Label>
            <div className="grid grid-cols-3 gap-2">
              {WIDGET_TYPES.map((widget) => {
                const Icon = widget.icon;
                return (
                  <Button
                    key={widget.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWidget(widget.value)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {widget.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="space-y-2">
            <Label>Widgets ({widgets.length})</Label>
            <div className="grid grid-cols-12 gap-4 min-h-[400px] border rounded-lg p-4">
              {widgets.map((widget, index) => (
                <Card
                  key={index}
                  className={cn(
                    'col-span-4 relative',
                    editingWidget === index && 'ring-2 ring-primary'
                  )}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                        <CardTitle className="text-sm">{widget.title}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWidget(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Input
                        placeholder="Widget title"
                        value={widget.title}
                        onChange={(e) =>
                          handleUpdateWidget(index, { title: e.target.value })
                        }
                        onClick={() => setEditingWidget(index)}
                      />
                      <Select
                        value={widget.dataSource.aggregation || 'count'}
                        onValueChange={(value) =>
                          handleUpdateWidget(index, {
                            dataSource: {
                              ...widget.dataSource,
                              aggregation: value as any,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="sum">Sum</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="min">Min</SelectItem>
                          <SelectItem value="max">Max</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {widgets.length === 0 && (
                <div className="col-span-12 text-center text-gray-500 py-12">
                  No widgets added. Click the buttons above to add widgets.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Dashboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

