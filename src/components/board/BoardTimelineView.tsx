import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  RefreshCw,
  Calendar,
  GanttChart,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  CalendarRange,
} from 'lucide-react';
import { boardAPI } from '@/lib/api';
import { Item, Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  addDays,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  differenceInDays,
  addDays as addDaysFn,
  subDays as subDaysFn,
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getStatusColorStyle } from './table/utils/cellValueFormatter';

interface BoardTimelineViewProps {
  boardId: string;
  columns?: Column[];
  onItemCreate?: () => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (item: Item) => void;
  onColumnsChange?: () => void;
}

interface TimelineItem {
  item: Item;
  startDate: Date | null;
  endDate: Date | null;
  row: number;
}

export const BoardTimelineView: React.FC<BoardTimelineViewProps> = ({
  boardId,
  columns = [],
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [dateColumns, setDateColumns] = useState<{ start: Column | null; end: Column | null }>({
    start: null,
    end: null,
  });
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week');
  const [customRangeStart, setCustomRangeStart] = useState<Date | null>(null);
  const [customRangeEnd, setCustomRangeEnd] = useState<Date | null>(null);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [statusColumn, setStatusColumn] = useState<Column | null>(null);
  const [dependencyColumn, setDependencyColumn] = useState<Column | null>(null);
  const [milestoneColumn, setMilestoneColumn] = useState<Column | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ item: TimelineItem; startX: number; startLeft: number } | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  useEffect(() => {
    // Find DATE or TIMELINE columns
    const dateCols = columns.filter(
      col => (col.type === 'DATE' || col.type === 'DATETIME' || col.type === 'TIMELINE') && !col.isHidden
    );
    
    setDateColumns({
      start: dateCols[0] || null,
      end: dateCols.length > 1 ? dateCols[1] : null,
    });
    
    // Find STATUS column for color coding
    const statusCol = columns.find(
      col => col.type === 'STATUS' && !col.isHidden
    );
    setStatusColumn(statusCol || null);
    
    // Find dependency column (LINK type that references items)
    const depCol = columns.find(
      col => (col.type === 'LINK' || col.type === 'DROPDOWN') && !col.isHidden
    );
    setDependencyColumn(depCol || null);
    
    // Find milestone column (CHECKBOX or custom column)
    const milestoneCol = columns.find(
      col => (col.type === 'CHECKBOX' || col.name.toLowerCase().includes('milestone')) && !col.isHidden
    );
    setMilestoneColumn(milestoneCol || null);
  }, [columns]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const responseData = response.data as { data?: unknown[]; items?: unknown[] };
        const itemsData = responseData.data || responseData.items || [];
        setItems(itemsData as Item[]);
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
      setLoading(false);
    }
  }, [boardId, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Process items for timeline display
  useEffect(() => {
    if (!dateColumns.start) {
      setTimelineItems([]);
      return;
    }

    const processed: TimelineItem[] = [];
    let rowIndex = 0;

    items.forEach((item) => {
      const startCell = item.cells?.[dateColumns.start!.id];
      const endCell = dateColumns.end ? item.cells?.[dateColumns.end.id] : null;

      const startValue = startCell
        ? typeof startCell === 'object' && 'value' in startCell
          ? startCell.value
          : startCell
        : null;
      
      const endValue = endCell
        ? typeof endCell === 'object' && 'value' in endCell
          ? endCell.value
          : endCell
        : null;

      let startDate: Date | null = null;
      let endDate: Date | null = null;

      try {
        if (startValue) {
          startDate = new Date(startValue as string);
        }
        if (endValue) {
          endDate = new Date(endValue as string);
        } else if (startDate) {
          // If no end date, use start date as end date (single day item)
          endDate = startDate;
        }
      } catch (error) {
        console.error('Error parsing dates:', error);
      }

      if (startDate) {
        processed.push({
          item,
          startDate,
          endDate: endDate || startDate,
          row: rowIndex++,
        });
      }
    });

    setTimelineItems(processed);
  }, [items, dateColumns]);

  // Calculate timeline range based on zoom level
  const getTimelineRange = () => {
    if (useCustomRange && customRangeStart && customRangeEnd) {
      return {
        start: startOfDay(customRangeStart),
        end: endOfDay(customRangeEnd),
      };
    }
    
    switch (zoomLevel) {
      case 'day':
        const dayStart = startOfDay(currentWeekStart);
        return {
          start: dayStart,
          end: endOfDay(dayStart),
        };
      case 'week':
        return {
          start: startOfWeek(currentWeekStart),
          end: endOfWeek(currentWeekStart),
        };
      case 'month':
        return {
          start: startOfMonth(currentWeekStart),
          end: endOfMonth(currentWeekStart),
        };
      default:
        return {
          start: startOfWeek(currentWeekStart),
          end: endOfWeek(currentWeekStart),
        };
    }
  };

  const timelineRange = getTimelineRange();
  const timelineDays = eachDayOfInterval({ start: timelineRange.start, end: timelineRange.end });
  const daysCount = timelineDays.length;

  const getItemColor = (item: Item): React.CSSProperties | undefined => {
    if (!statusColumn) return undefined;
    
    const cell = item.cells?.[statusColumn.id];
    if (!cell) return undefined;
    
    const statusValue = typeof cell === 'object' && 'value' in cell ? String(cell.value) : String(cell);
    if (!statusValue) return undefined;
    
    return getStatusColorStyle(statusValue, statusColumn);
  };

  const getItemDependencies = (item: Item): string[] => {
    if (!dependencyColumn) return [];
    
    const cell = item.cells?.[dependencyColumn.id];
    if (!cell) return [];
    
    const value = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
    if (!value) return [];
    
    // Handle different formats
    if (Array.isArray(value)) {
      return value.map(v => String(v));
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(v => String(v)) : [String(value)];
      } catch {
        return [String(value)];
      }
    }
    
    return [String(value)];
  };

  const isMilestone = (item: Item): boolean => {
    if (!milestoneColumn) return false;
    
    const cell = item.cells?.[milestoneColumn.id];
    if (!cell) return false;
    
    const value = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
    return Boolean(value);
  };

  // Calculate critical path (longest path through dependencies)
  const calculateCriticalPath = (): Set<string> => {
    if (!showCriticalPath || !dependencyColumn) return new Set();
    
    const itemMap = new Map<string, TimelineItem>();
    timelineItems.forEach(ti => {
      itemMap.set(ti.item.id, ti);
    });
    
    // Build dependency graph
    const dependencies = new Map<string, string[]>();
    timelineItems.forEach(ti => {
      const deps = getItemDependencies(ti.item);
      dependencies.set(ti.item.id, deps);
    });
    
    // Find all items with no dependencies (start nodes)
    const startNodes = timelineItems.filter(ti => {
      const deps = dependencies.get(ti.item.id) || [];
      return deps.length === 0;
    });
    
    if (startNodes.length === 0) return new Set();
    
    let longestPath: string[] = [];
    let longestDuration = 0;
    
    const calculatePathDuration = (itemId: string, path: string[], visited: Set<string>): number => {
      if (visited.has(itemId)) return 0;
      visited.add(itemId);
      
      const timelineItem = itemMap.get(itemId);
      if (!timelineItem || !timelineItem.startDate || !timelineItem.endDate) return 0;
      
      const duration = timelineItem.endDate.getTime() - timelineItem.startDate.getTime();
      const currentPath = [...path, itemId];
      
      // Find items that depend on this item (dependents)
      const dependents = timelineItems.filter(ti => {
        const deps = dependencies.get(ti.item.id) || [];
        return deps.includes(itemId);
      });
      
      if (dependents.length === 0) {
        // End node
        const totalDuration = currentPath.reduce((sum, id) => {
          const ti = itemMap.get(id);
          if (!ti || !ti.startDate || !ti.endDate) return sum;
          return sum + (ti.endDate.getTime() - ti.startDate.getTime());
        }, 0);
        
        if (totalDuration > longestDuration) {
          longestDuration = totalDuration;
          longestPath = currentPath;
        }
        return duration;
      }
      
      let maxDuration = duration;
      dependents.forEach(dep => {
        const depDuration = calculatePathDuration(dep.item.id, currentPath, new Set(visited));
        if (depDuration + duration > maxDuration) {
          maxDuration = depDuration + duration;
        }
      });
      
      return maxDuration;
    };
    
    // Calculate paths from all start nodes
    startNodes.forEach(node => {
      calculatePathDuration(node.item.id, [], new Set());
    });
    
    return new Set(longestPath);
  };

  const criticalPathItems = calculateCriticalPath();

  const navigateTimeline = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentWeekStart(startOfWeek(new Date()));
      return;
    }

    if (useCustomRange) {
      const daysDiff = differenceInDays(timelineRange.end, timelineRange.start);
      if (direction === 'prev') {
        setCustomRangeStart(subDaysFn(timelineRange.start, daysDiff));
        setCustomRangeEnd(subDaysFn(timelineRange.end, daysDiff));
      } else {
        setCustomRangeStart(addDaysFn(timelineRange.start, daysDiff));
        setCustomRangeEnd(addDaysFn(timelineRange.end, daysDiff));
      }
      return;
    }

    switch (zoomLevel) {
      case 'day':
        setCurrentWeekStart(direction === 'prev' ? subDaysFn(currentWeekStart, 1) : addDaysFn(currentWeekStart, 1));
        break;
      case 'week':
        setCurrentWeekStart(direction === 'prev' ? subWeeks(currentWeekStart, 1) : addWeeks(currentWeekStart, 1));
        break;
      case 'month':
        setCurrentWeekStart(direction === 'prev' ? subMonths(currentWeekStart, 1) : addMonths(currentWeekStart, 1));
        break;
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel === 'month') {
      setZoomLevel('week');
      setCurrentWeekStart(startOfWeek(timelineRange.start));
    } else if (zoomLevel === 'week') {
      setZoomLevel('day');
      setCurrentWeekStart(startOfDay(timelineRange.start));
    }
    setUseCustomRange(false);
  };

  const handleZoomOut = () => {
    if (zoomLevel === 'day') {
      setZoomLevel('week');
      setCurrentWeekStart(startOfWeek(timelineRange.start));
    } else if (zoomLevel === 'week') {
      setZoomLevel('month');
      setCurrentWeekStart(startOfMonth(timelineRange.start));
    }
    setUseCustomRange(false);
  };

  const getTimelineTitle = () => {
    if (useCustomRange && customRangeStart && customRangeEnd) {
      return `${format(customRangeStart, 'MMM d')} - ${format(customRangeEnd, 'MMM d, yyyy')}`;
    }
    
    switch (zoomLevel) {
      case 'day':
        return format(timelineRange.start, 'EEEE, MMMM d, yyyy');
      case 'week':
        return `${format(timelineRange.start, 'MMM d')} - ${format(timelineRange.end, 'MMM d, yyyy')}`;
      case 'month':
        return format(timelineRange.start, 'MMMM yyyy');
      default:
        return format(timelineRange.start, 'MMM d') + ' - ' + format(timelineRange.end, 'MMM d, yyyy');
    }
  };

  const getItemPosition = (timelineItem: TimelineItem) => {
    if (!timelineItem.startDate) return { left: 0, width: 0 };

    const rangeStartTime = timelineRange.start.getTime();
    const rangeEndTime = timelineRange.end.getTime();
    const itemStartTime = timelineItem.startDate.getTime();
    const itemEndTime = timelineItem.endDate?.getTime() || itemStartTime;

    // Check if item overlaps with current range
    if (itemEndTime < rangeStartTime || itemStartTime > rangeEndTime) {
      return null;
    }

    const actualStart = Math.max(itemStartTime, rangeStartTime);
    const actualEnd = Math.min(itemEndTime, rangeEndTime);
    const rangeDuration = rangeEndTime - rangeStartTime;
    const itemDuration = actualEnd - actualStart;

    const leftPercent = ((actualStart - rangeStartTime) / rangeDuration) * 100;
    const widthPercent = (itemDuration / rangeDuration) * 100;

    return {
      left: leftPercent,
      width: Math.max(widthPercent, 0.5), // Min 0.5% width for visibility
    };
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dateColumns.start) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12 text-center">
          <GanttChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Date Column Found</h3>
          <p className="text-muted-foreground mb-4">
            Timeline view requires at least one DATE or DATETIME column. Create one to use this view.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxRows = Math.max(...timelineItems.map(t => t.row), 0) + 1;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <GanttChart className="h-5 w-5" />
            <span>Timeline View</span>
            <Badge variant="outline">
              {getTimelineTitle()}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={zoomLevel} onValueChange={(value: 'day' | 'week' | 'month') => {
              setZoomLevel(value);
              setUseCustomRange(false);
              if (value === 'day') {
                setCurrentWeekStart(startOfDay(new Date()));
              } else if (value === 'week') {
                setCurrentWeekStart(startOfWeek(new Date()));
              } else {
                setCurrentWeekStart(startOfMonth(new Date()));
              }
            }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel === 'month'}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel === 'day'}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRangeDialogOpen(true)}
              title="Custom Range"
            >
              <CalendarRange className="h-4 w-4" />
            </Button>
            <Button
              variant={showDependencies ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDependencies(!showDependencies)}
              title="Toggle Dependencies"
            >
              <GanttChart className="h-4 w-4" />
            </Button>
            <Button
              variant={showCriticalPath ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCriticalPath(!showCriticalPath)}
              title="Toggle Critical Path"
              className={showCriticalPath ? "bg-red-500 hover:bg-red-600 text-white" : ""}
            >
              🔴
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('today')}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTimeline('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchItems}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onItemCreate && (
              <Button onClick={onItemCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className={`grid border-b-2 border-slate-300 mb-2`} style={{ gridTemplateColumns: `200px repeat(${daysCount}, minmax(100px, 1fr))` }}>
              <div className="p-2 font-semibold text-sm text-slate-700 border-r">Items</div>
              {timelineDays.map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-2 text-center border-l text-sm",
                    isSameDay(day, new Date()) && "bg-blue-50 font-bold"
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div>{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            {/* Timeline rows */}
            <div className="relative" style={{ minHeight: `${maxRows * 60}px` }}>
              {/* Background grid */}
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `200px repeat(${daysCount}, minmax(100px, 1fr))` }}>
                <div className="border-r"></div>
                {timelineDays.map((_, idx) => (
                  <div key={idx} className="border-r border-dashed border-slate-200"></div>
                ))}
              </div>

              {/* Dependency links */}
              {showDependencies && (() => {
                const links: Array<{ source: TimelineItem; target: TimelineItem; isCritical: boolean }> = [];
                
                timelineItems.forEach((timelineItem) => {
                  const deps = getItemDependencies(timelineItem.item);
                  deps.forEach((depId) => {
                    // Find the dependency item (what this item depends on)
                    const dependencyItem = timelineItems.find(ti => ti.item.id === depId);
                    if (dependencyItem) {
                      // Arrow goes from dependency (source) to dependent item (target)
                      // This means: dependency must finish before dependent can start
                      links.push({
                        source: dependencyItem, // What this item depends on
                        target: timelineItem,   // This item
                        isCritical: criticalPathItems.has(dependencyItem.item.id) && criticalPathItems.has(timelineItem.item.id),
                      });
                    }
                  });
                });
                
                if (links.length === 0) return null;
                
                const itemWidth = 200;
                const timelineWidth = 800 + daysCount * 100;
                const timelineWidthPx = timelineWidth - itemWidth;
                
                return (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none z-0"
                    style={{ width: `${timelineWidth}px`, height: `${Math.max(...timelineItems.map(t => t.row), 0) * 60 + 60}px` }}
                  >
                    <defs>
                      <marker
                        id="arrowhead-critical"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
                      </marker>
                      <marker
                        id="arrowhead-normal"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
                      </marker>
                    </defs>
                    {links.map((link, idx) => {
                      const sourcePos = getItemPosition(link.source);
                      const targetPos = getItemPosition(link.target);
                      if (!sourcePos || !targetPos || !link.source.startDate || !link.target.startDate) return null;
                      
                      const sourceRow = link.source.row;
                      const targetRow = link.target.row;
                      
                      // Calculate arrow positions
                      const sourceX = itemWidth + (sourcePos.left + sourcePos.width) * (timelineWidthPx / 100);
                      const sourceY = sourceRow * 60 + 30; // Middle of bar
                      const targetX = itemWidth + targetPos.left * (timelineWidthPx / 100);
                      const targetY = targetRow * 60 + 30;
                      
                      // Calculate arrow path with curve
                      const midX = (sourceX + targetX) / 2;
                      const curveHeight = Math.abs(targetY - sourceY) * 0.5 + 30;
                      const controlY = Math.min(sourceY, targetY) - curveHeight;
                      
                      return (
                        <path
                          key={`dep-${link.source.item.id}-${link.target.item.id}-${idx}`}
                          d={`M ${sourceX} ${sourceY} Q ${midX} ${controlY} ${targetX} ${targetY}`}
                          stroke={link.isCritical ? '#ef4444' : '#64748b'}
                          strokeWidth={link.isCritical ? 3 : 2}
                          fill="none"
                          strokeDasharray={link.isCritical ? '0' : '5,5'}
                          markerEnd={`url(#arrowhead-${link.isCritical ? 'critical' : 'normal'})`}
                          className="transition-all"
                        />
                      );
                    })}
                  </svg>
                );
              })()}

              {/* Timeline items */}
              {timelineItems.map((timelineItem, idx) => {
                const position = getItemPosition(timelineItem);
                if (!position) return null;

                const itemColor = getItemColor(timelineItem.item);
                const itemWidth = 200; // Fixed width for items column
                const isMilestoneItem = isMilestone(timelineItem.item);
                const isCritical = criticalPathItems.has(timelineItem.item.id);
                
                return (
                  <div
                    key={timelineItem.item.id}
                    className="absolute top-2 h-12 cursor-move group z-10"
                    style={{
                      left: `${itemWidth}px`,
                      marginLeft: `${position.left}%`,
                      width: `${position.width}%`,
                      top: `${timelineItem.row * 60 + 4}px`,
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 0 && !isMilestoneItem) { // Left click only, no drag for milestones
                        e.stopPropagation();
                        setDraggedItem({
                          item: timelineItem,
                          startX: e.clientX,
                          startLeft: position.left,
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      if (draggedItem && draggedItem.item.item.id === timelineItem.item.id && e.buttons === 1) {
                        e.preventDefault();
                        e.stopPropagation();
                        const deltaX = e.clientX - draggedItem.startX;
                        const timelineWidth = 800 + daysCount * 100 - itemWidth;
                        const deltaPercent = (deltaX / timelineWidth) * 100;
                        const newLeft = Math.max(0, Math.min(100 - position.width, draggedItem.startLeft + deltaPercent));
                        
                        // Update visual position
                        e.currentTarget.style.marginLeft = `${newLeft}%`;
                        e.currentTarget.style.opacity = '0.8';
                      }
                    }}
                    onMouseUp={async (e) => {
                      if (draggedItem && draggedItem.item.item.id === timelineItem.item.id && dateColumns.start) {
                        e.preventDefault();
                        e.stopPropagation();
                        const deltaX = e.clientX - draggedItem.startX;
                        const timelineWidth = 800 + daysCount * 100 - itemWidth;
                        const deltaPercent = (deltaX / timelineWidth) * 100;
                        const rangeDuration = timelineRange.end.getTime() - timelineRange.start.getTime();
                        const deltaMs = (deltaPercent / 100) * rangeDuration;
                        
                        try {
                          const newStartDate = new Date(timelineItem.startDate!.getTime() + deltaMs);
                          const duration = timelineItem.endDate!.getTime() - timelineItem.startDate!.getTime();
                          const newEndDate = new Date(newStartDate.getTime() + duration);
                          
                          // Update start date
                          await boardAPI.updateItemCell(boardId, timelineItem.item.id, dateColumns.start.id, newStartDate.toISOString());
                          
                          // Update end date if exists
                          if (dateColumns.end) {
                            await boardAPI.updateItemCell(boardId, timelineItem.item.id, dateColumns.end.id, newEndDate.toISOString());
                          }
                          
                          toast({
                            title: 'Success',
                            description: 'Item dates updated',
                          });
                          
                          fetchItems();
                        } catch (error) {
                          console.error('Error updating item dates:', error);
                          toast({
                            title: 'Error',
                            description: 'Failed to update item dates',
                            variant: 'destructive',
                          });
                          // Reset position on error
                          e.currentTarget.style.marginLeft = `${position.left}%`;
                        }
                        e.currentTarget.style.opacity = '1';
                      }
                      setDraggedItem(null);
                    }}
                    onMouseLeave={(e) => {
                      if (draggedItem && draggedItem.item.item.id === timelineItem.item.id) {
                        // Reset position if dragged outside
                        e.currentTarget.style.marginLeft = `${position.left}%`;
                        e.currentTarget.style.opacity = '1';
                        setDraggedItem(null);
                      }
                    }}
                    onClick={(e) => {
                      if (!draggedItem) {
                        onItemEdit?.(timelineItem.item);
                      }
                    }}
                  >
                    {isMilestoneItem ? (
                      // Milestone marker (diamond shape)
                      <div
                        className={cn(
                          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
                          "w-6 h-6 rotate-45 cursor-pointer transition-all",
                          "border-2 shadow-lg",
                          isCritical && "border-red-500 bg-red-500",
                          !isCritical && itemColor ? "border-blue-500" : "border-blue-500 bg-blue-500"
                        )}
                        style={itemColor && !isCritical ? {
                          borderColor: itemColor.borderColor || itemColor.color,
                          backgroundColor: itemColor.backgroundColor || itemColor.color,
                        } : undefined}
                        title={`Milestone: ${timelineItem.item.name}\n${format(timelineItem.startDate!, 'PP')}`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                          <span className="text-[8px] font-bold text-white">★</span>
                        </div>
                      </div>
                    ) : (
                      // Regular bar
                      <div
                        className={cn(
                          "h-full rounded px-2 py-1 text-white text-xs",
                          "transition-colors shadow-sm",
                          "border flex items-center",
                          "group-hover:shadow-md",
                          isCritical && "ring-2 ring-red-500 ring-offset-1",
                          !itemColor && !isCritical && "bg-blue-500 border-blue-600 hover:bg-blue-600"
                        )}
                        style={itemColor && !isCritical ? {
                          backgroundColor: itemColor.backgroundColor || itemColor.color || '#3b82f6',
                          borderColor: itemColor.borderColor || itemColor.color || '#2563eb',
                          color: itemColor.color || '#ffffff',
                        } : isCritical ? {
                          backgroundColor: '#ef4444',
                          borderColor: '#dc2626',
                        } : undefined}
                        title={`${timelineItem.item.name}\n${format(timelineItem.startDate!, 'PP')} - ${format(timelineItem.endDate || timelineItem.startDate!, 'PP')}${isCritical ? '\n🔴 Critical Path' : ''}`}
                      >
                        <div className="truncate font-medium">{timelineItem.item.name}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Row labels */}
              {timelineItems.map((timelineItem, idx) => {
                if (idx > 0 && timelineItems[idx - 1].row === timelineItem.row) return null;
                return (
                  <div
                    key={`label-${timelineItem.row}`}
                    className="absolute left-0 px-2 py-1 text-xs text-muted-foreground border-r bg-white/80 z-10"
                    style={{ top: `${timelineItem.row * 60 + 4}px`, width: '200px', height: '48px' }}
                  >
                    <div className="truncate font-medium">
                      {timelineItem.item.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {timelineItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items with dates found for this period.</p>
            {onItemCreate && (
              <Button onClick={onItemCreate} className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Item
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Custom Range Dialog */}
      <Dialog open={rangeDialogOpen} onOpenChange={setRangeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5" />
              Select Timeline Range
            </DialogTitle>
            <DialogDescription>
              Choose a custom date range for the timeline view.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="range-start">Start Date</Label>
              <Input
                id="range-start"
                type="date"
                value={customRangeStart ? format(customRangeStart, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setCustomRangeStart(new Date(e.target.value));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range-end">End Date</Label>
              <Input
                id="range-end"
                type="date"
                value={customRangeEnd ? format(customRangeEnd, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setCustomRangeEnd(new Date(e.target.value));
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUseCustomRange(false);
                setRangeDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (customRangeStart && customRangeEnd && customRangeStart <= customRangeEnd) {
                  setUseCustomRange(true);
                  setRangeDialogOpen(false);
                } else {
                  toast({
                    title: 'Error',
                    description: 'Please select valid start and end dates',
                    variant: 'destructive',
                  });
                }
              }}
            >
              Apply Range
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

