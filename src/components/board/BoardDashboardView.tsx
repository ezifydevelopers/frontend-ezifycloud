import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  PieChart,
  LineChart,
  RefreshCw,
  Download,
  Settings,
  LayoutGrid,
  Image as ImageIcon,
  Move,
  Maximize2,
} from 'lucide-react';
import { boardAPI } from '@/lib/api';
import { Item, Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { KPICardWidget } from './dashboard/KPICardWidget';
import { ChartWidget } from './dashboard/ChartWidget';
import { SummaryTableWidget } from './dashboard/SummaryTableWidget';
import { FilterWidget } from './dashboard/FilterWidget';
import { DashboardWidgetContainer } from './dashboard/DashboardWidgetContainer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface BoardDashboardViewProps {
  boardId: string;
  columns?: Column[];
  items?: Item[];
  onItemCreate?: () => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (item: Item) => void;
  onColumnsChange?: () => void;
}

interface DashboardMetrics {
  totalItems: number;
  totalValue: number;
  averageValue: number;
  itemsByStatus: Record<string, number>;
  recentItems: Item[];
  trendData: Array<{ date: string; count: number; value: number }>;
}

export const BoardDashboardView: React.FC<BoardDashboardViewProps> = ({
  boardId,
  columns = [],
  items: externalItems,
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>(externalItems || []);
  const [loading, setLoading] = useState(!externalItems);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [statusColumn, setStatusColumn] = useState<Column | null>(null);
  const [valueColumn, setValueColumn] = useState<Column | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<Set<string>>(
    new Set(['kpi', 'charts', 'table', 'filters'])
  );
  const [widgetOrder, setWidgetOrder] = useState<string[]>(['filters', 'kpi', 'charts', 'table']);
  const [widgetSizes, setWidgetSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dashboardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const statusCol = columns.find(col => col.type === 'STATUS' && !col.isHidden);
    const valueCol = columns.find(
      col => (col.type === 'NUMBER' || col.type === 'CURRENCY') && !col.isHidden
    );
    setStatusColumn(statusCol || null);
    setValueColumn(valueCol || null);
  }, [columns]);

  const fetchItems = useCallback(async (showRefresh = false) => {
    if (externalItems && !showRefresh) {
      setItems(externalItems);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const itemsData = (response.data as { data?: unknown[] })?.data || [];
        setItems(itemsData as Item[]);
        if (showRefresh) {
          toast({
            title: 'Success',
            description: 'Dashboard data refreshed',
          });
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      if (showRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [boardId, externalItems, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Apply filters to items
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      return Object.entries(filters).every(([columnId, filterValue]) => {
        if (!filterValue) return true;
        const column = columns.find(c => c.id === columnId);
        if (!column) return true;

        const cellValue = item.cells?.[columnId];
        if (!cellValue) return false;

        const value = typeof cellValue === 'object' && 'value' in cellValue
          ? String(cellValue.value)
          : String(cellValue);

        if (column.type === 'TEXT') {
          return value.toLowerCase().includes(String(filterValue).toLowerCase());
        }

        return value === String(filterValue);
      });
    });
  }, [items, filters, columns]);

  useEffect(() => {
    if (filteredItems.length === 0 && items.length > 0) {
      // Still calculate metrics even if filters hide all items
      setMetrics({
        totalItems: 0,
        totalValue: 0,
        averageValue: 0,
        itemsByStatus: {},
        recentItems: [],
        trendData: [],
      });
      return;
    }

    if (filteredItems.length === 0) {
      setMetrics(null);
      return;
    }

    // Calculate metrics from filtered items
    let totalValue = 0;
    const itemsByStatus: Record<string, number> = {};
    const recentItems = [...filteredItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Calculate trend data
    const now = new Date();
    const startDate = startOfMonth(subMonths(now, 11));
    const trendData: Array<{ date: string; count: number; value: number }> = [];

    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(subMonths(now, 11 - i));
      const monthEnd = endOfMonth(monthStart);
      const monthItems = filteredItems.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= monthStart && itemDate <= monthEnd;
      });

      let monthValue = 0;
      monthItems.forEach(item => {
        if (valueColumn && item.cells?.[valueColumn.id]) {
          const cellValue = item.cells[valueColumn.id];
          const numValue = typeof cellValue === 'object' && 'value' in cellValue
            ? Number(cellValue.value)
            : Number(cellValue);
          if (!isNaN(numValue)) {
            monthValue += numValue;
            totalValue += numValue;
          }
        }
      });

      trendData.push({
        date: format(monthStart, 'MMM yyyy'),
        count: monthItems.length,
        value: monthValue,
      });
    }

    // Group by status
    filteredItems.forEach(item => {
      let status = 'No Status';
      if (statusColumn && item.cells?.[statusColumn.id]) {
        const cellValue = item.cells[statusColumn.id];
        status = typeof cellValue === 'object' && 'value' in cellValue
          ? String(cellValue.value)
          : String(cellValue);
      } else if (item.status) {
        status = item.status;
      }

      itemsByStatus[status] = (itemsByStatus[status] || 0) + 1;
    });

    const averageValue = filteredItems.length > 0 ? totalValue / filteredItems.length : 0;

    setMetrics({
      totalItems: filteredItems.length,
      totalValue,
      averageValue,
      itemsByStatus,
      recentItems,
      trendData,
    });
  }, [filteredItems, statusColumn, valueColumn]);

  // Prepare chart data - MUST be before early returns
  const statusChartData = React.useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.itemsByStatus).map(([name, value]) => ({
      name,
      value: value as number,
    }));
  }, [metrics]);

  const trendChartData = React.useMemo(() => {
    if (!metrics) return [];
    return metrics.trendData.map(data => ({
      name: data.date,
      count: data.count,
      value: data.value,
    }));
  }, [metrics]);

  // Prepare summary table data
  const summaryTableData = React.useMemo(() => {
    if (!metrics) return [];
    return metrics.recentItems.map(item => ({
      name: item.name,
      status: statusColumn && item.cells?.[statusColumn.id]
        ? (typeof item.cells[statusColumn.id] === 'object' && 'value' in item.cells[statusColumn.id]
          ? String(item.cells[statusColumn.id].value)
          : String(item.cells[statusColumn.id]))
        : item.status || 'No Status',
      value: valueColumn && item.cells?.[valueColumn.id]
        ? (typeof item.cells[valueColumn.id] === 'object' && 'value' in item.cells[valueColumn.id]
          ? Number(item.cells[valueColumn.id].value)
          : Number(item.cells[valueColumn.id]))
        : 0,
      createdAt: new Date(item.createdAt),
    }));
  }, [metrics, statusColumn, valueColumn]);

  // Widget positions for drag & drop
  const widgetPositions = React.useMemo(() => {
    return widgetOrder.map((id, index) => ({
      id,
      order: index,
      size: widgetSizes[id],
    }));
  }, [widgetOrder, widgetSizes]);

  const handleWidgetReorder = useCallback((draggedId: string, targetId: string) => {
    setWidgetOrder(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedId);
      const targetIndex = newOrder.indexOf(targetId);
      
      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
        return prev;
      }

      // Remove dragged item
      newOrder.splice(draggedIndex, 1);
      
      // Calculate insert index (account for removed item)
      const insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newOrder.splice(insertIndex, 0, draggedId);
      
      // Save to localStorage
      localStorage.setItem(`dashboard_widget_order_${boardId}`, JSON.stringify(newOrder));
      return newOrder;
    });
  }, [boardId]);

  const handleWidgetResize = useCallback((widgetId: string, size: { width: number; height: number }) => {
    setWidgetSizes(prev => {
      const newSizes = { ...prev, [widgetId]: size };
      localStorage.setItem(`dashboard_widget_sizes_${boardId}`, JSON.stringify(newSizes));
      return newSizes;
    });
  }, [boardId]);

  // Load widget order and sizes from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(`dashboard_widget_order_${boardId}`);
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        setWidgetOrder(parsed);
      } catch (e) {
        // Ignore parse errors
      }
    }

    const savedSizes = localStorage.getItem(`dashboard_widget_sizes_${boardId}`);
    if (savedSizes) {
      try {
        const parsed = JSON.parse(savedSizes);
        setWidgetSizes(parsed);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [boardId]);

  // Export dashboard as image
  const handleExportImage = useCallback(async () => {
    if (!dashboardRef.current) return;

    try {
      setRefreshing(true);
      
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `dashboard-${boardId}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Dashboard exported as image',
      });
    } catch (error) {
      console.error('Error exporting image:', error);
      toast({
        title: 'Error',
        description: 'Failed to export dashboard image',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  }, [boardId, toast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground mb-4">
            Create items to see dashboard metrics and analytics.
          </p>
          {onItemCreate && (
            <Button onClick={onItemCreate}>
              Create First Item
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Overview and analytics for this board</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchItems(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportImage}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Export Image
          </Button>
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Move className="h-4 w-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit Layout'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCustomizeOpen(true)}>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>

      {/* Widgets in order */}
      <div className={cn('space-y-6', isEditMode && 'border-2 border-dashed border-blue-300 rounded-lg p-4')}>
        {widgetOrder
          .filter(id => visibleWidgets.has(id))
          .map((widgetId) => {
            const widgetPosition = widgetPositions.find(w => w.id === widgetId);
            
            if (widgetId === 'filters') {
              return (
                <DashboardWidgetContainer
                  key={widgetId}
                  widgetId={widgetId}
                  widgetPositions={widgetPositions}
                  onWidgetReorder={handleWidgetReorder}
                  resizable={isEditMode}
                  onWidgetResize={handleWidgetResize}
                >
                  <FilterWidget
                    columns={columns}
                    filters={filters}
                    onFilterChange={setFilters}
                  />
                </DashboardWidgetContainer>
              );
            }

            if (widgetId === 'kpi') {
              return (
                <DashboardWidgetContainer
                  key={widgetId}
                  widgetId={widgetId}
                  widgetPositions={widgetPositions}
                  onWidgetReorder={handleWidgetReorder}
                  resizable={isEditMode}
                  onWidgetResize={handleWidgetResize}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICardWidget
                      title="Total Items"
                      value={metrics.totalItems}
                      icon={FileText}
                      subtitle={filteredItems.length !== items.length ? `${filteredItems.length} filtered` : `${items.length} items in board`}
                      color="blue"
                    />
                    {valueColumn && (
                      <>
                        <KPICardWidget
                          title="Total Value"
                          value={formatCurrency(metrics.totalValue)}
                          icon={DollarSign}
                          subtitle="Across all items"
                          color="green"
                        />
                        <KPICardWidget
                          title="Average Value"
                          value={formatCurrency(metrics.averageValue)}
                          icon={TrendingUp}
                          subtitle="Per item"
                          color="purple"
                        />
                      </>
                    )}
                    <KPICardWidget
                      title="Recent Items"
                      value={metrics.recentItems.length}
                      icon={Clock}
                      subtitle="Last 5 items created"
                      color="orange"
                    />
                  </div>
                </DashboardWidgetContainer>
              );
            }

            if (widgetId === 'charts') {
              return (
                <DashboardWidgetContainer
                  key={widgetId}
                  widgetId={widgetId}
                  widgetPositions={widgetPositions}
                  onWidgetReorder={handleWidgetReorder}
                  resizable={isEditMode}
                  onWidgetResize={handleWidgetResize}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {statusColumn && statusChartData.length > 0 && (
                      <ChartWidget
                        title="Items by Status"
                        type="pie"
                        data={statusChartData}
                        height={300}
                      />
                    )}
                    {trendChartData.length > 0 && (
                      <ChartWidget
                        title="Trend Analysis"
                        type="line"
                        data={trendChartData}
                        dataKey="count"
                        height={300}
                      />
                    )}
                    {statusColumn && statusChartData.length > 0 && (
                      <ChartWidget
                        title="Status Distribution"
                        type="bar"
                        data={statusChartData}
                        height={300}
                      />
                    )}
                  </div>
                </DashboardWidgetContainer>
              );
            }

            if (widgetId === 'table') {
              return (
                <DashboardWidgetContainer
                  key={widgetId}
                  widgetId={widgetId}
                  widgetPositions={widgetPositions}
                  onWidgetReorder={handleWidgetReorder}
                  resizable={isEditMode}
                  onWidgetResize={handleWidgetResize}
                >
                  <SummaryTableWidget
                    title="Recent Items"
                    columns={[
                      { key: 'name', label: 'Name', sortable: true },
                      ...(statusColumn ? [{ key: 'status', label: 'Status', sortable: true }] : []),
                      ...(valueColumn ? [{ key: 'value', label: 'Value', sortable: true }] : []),
                      { key: 'createdAt', label: 'Created', sortable: true },
                    ]}
                    data={summaryTableData}
                    onRowClick={(row) => {
                      const item = items.find(i => i.name === row.name);
                      if (item) onItemEdit?.(item);
                    }}
                    maxRows={10}
                  />
                </DashboardWidgetContainer>
              );
            }

            return null;
          })}
      </div>

      {/* Customize Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Customize Dashboard
            </DialogTitle>
            <DialogDescription>
              Select which widgets to display on your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { id: 'filters', label: 'Filter Widget', description: 'Filter items by column values' },
              { id: 'kpi', label: 'KPI Cards', description: 'Key performance indicators' },
              { id: 'charts', label: 'Charts', description: 'Visual charts and graphs' },
              { id: 'table', label: 'Summary Table', description: 'Recent items table' },
            ].map((widget) => (
              <div key={widget.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={widget.id}
                  checked={visibleWidgets.has(widget.id)}
                  onCheckedChange={(checked) => {
                    const newSet = new Set(visibleWidgets);
                    if (checked) {
                      newSet.add(widget.id);
                    } else {
                      newSet.delete(widget.id);
                    }
                    setVisibleWidgets(newSet);
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={widget.id} className="font-medium cursor-pointer">
                    {widget.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{widget.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

