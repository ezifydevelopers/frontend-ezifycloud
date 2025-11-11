import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  RefreshCw,
  LayoutGrid,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { WidgetConfig } from '@/types/dashboard';

interface DashboardBuilderProps {
  workspaceId: string;
  boardId?: string;
  onSave?: () => void;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  workspaceId,
  boardId,
  onSave,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  const handleAddWidget = () => {
    const newWidget: WidgetConfig = {
      type: 'kpi_card',
      title: 'New Widget',
      dataSource: {
        type: boardId ? 'board' : 'workspace',
        boardId,
        aggregation: 'count',
      },
      position: { x: 0, y: widgets.length, w: 4, h: 2 },
    };
    setWidgets([...widgets, newWidget]);
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
      setOpen(false);
      onSave?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Dashboard</DialogTitle>
          <DialogDescription>
            Build a custom dashboard with widgets and metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dashboard description"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Widgets ({widgets.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddWidget}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </div>
            {widgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <LayoutGrid className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No widgets yet. Add widgets to build your dashboard.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {widgets.map((widget, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{widget.title}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setWidgets(widgets.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Type: {widget.type} | Aggregation: {widget.dataSource.aggregation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Dashboard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

