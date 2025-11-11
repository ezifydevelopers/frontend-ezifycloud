import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  Grid3x3,
  CalendarDays,
  Clock,
  List,
  Settings,
  Calendar as CalendarIcon2,
} from 'lucide-react';
import { boardAPI } from '@/lib/api';
import { Item, Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getStatusColorStyle } from './table/utils/cellValueFormatter';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameWeek,
  isWithinInterval,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isWeekend } from 'date-fns';

interface BoardCalendarViewProps {
  boardId: string;
  columns?: Column[];
  onItemCreate?: () => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (item: Item) => void;
  onColumnsChange?: () => void;
}

export const BoardCalendarView: React.FC<BoardCalendarViewProps> = ({
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateColumn, setDateColumn] = useState<Column | null>(null);
  const [endDateColumn, setEndDateColumn] = useState<Column | null>(null);
  const [statusColumn, setStatusColumn] = useState<Column | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [draggedItem, setDraggedItem] = useState<{ item: Item; originalDate: Date } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDateColumns, setSelectedDateColumns] = useState<string[]>([]);
  const [workingDaysOnly, setWorkingDaysOnly] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(true);

  useEffect(() => {
    // Find DATE or DATETIME columns for calendar
    const dateCols = columns.filter(
      col => (col.type === 'DATE' || col.type === 'DATETIME' || col.type === 'TIMELINE') && !col.isHidden
    );
    
    // Load saved preferences or use defaults
    const savedPrefs = localStorage.getItem(`calendarSettings_${boardId}`);
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setSelectedDateColumns(prefs.dateColumns || []);
        setWorkingDaysOnly(prefs.workingDaysOnly || false);
        setShowTimeSlots(prefs.showTimeSlots !== false);
      } catch {
        // Invalid preferences, use defaults
      }
    }
    
    // If no saved preferences, initialize with first column
    if (dateCols.length > 0 && selectedDateColumns.length === 0) {
      setSelectedDateColumns([dateCols[0].id]);
    }
    
    // Set primary date column (first selected or first available)
    const primaryColId = selectedDateColumns[0] || dateCols[0]?.id;
    const primaryCol = dateCols.find(col => col.id === primaryColId) || dateCols[0] || null;
    setDateColumn(primaryCol);
    
    // Second date column is the end date (for ranges)
    setEndDateColumn(dateCols.length > 1 ? dateCols[1] : null);
    
    // Find STATUS column for color coding
    const statusCol = columns.find(
      col => col.type === 'STATUS' && !col.isHidden
    );
    setStatusColumn(statusCol || null);
  }, [columns, boardId]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const itemsData = (response.data as any).data || [];
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

  const getItemDateRange = (item: Item): { start: Date | null; end: Date | null } => {
    if (!dateColumn) return { start: null, end: null };
    
    const startCell = item.cells?.[dateColumn.id];
    const startValue = startCell ? (typeof startCell === 'object' && 'value' in startCell ? startCell.value : startCell) : null;
    
    let startDate: Date | null = null;
    if (startValue) {
      try {
        startDate = new Date(startValue as string);
      } catch {
        // Invalid date
      }
    }
    
    let endDate: Date | null = null;
    if (endDateColumn) {
      const endCell = item.cells?.[endDateColumn.id];
      const endValue = endCell ? (typeof endCell === 'object' && 'value' in endCell ? endCell.value : endCell) : null;
      if (endValue) {
        try {
          endDate = new Date(endValue as string);
        } catch {
          // Invalid date
        }
      }
    }
    
    // If no end date, use start date as end date (single day item)
    if (startDate && !endDate) {
      endDate = startDate;
    }
    
    return { start: startDate, end: endDate };
  };

  const getItemsForDate = (date: Date): Item[] => {
    if (!dateColumn) return [];
    
    return items.filter(item => {
      const { start, end } = getItemDateRange(item);
      
      if (!start) return false;
      
      // Check if date falls within the range
      if (end) {
        return isWithinInterval(date, { start, end });
      }
      
      return isSameDay(start, date);
    });
  };

  const getItemColor = (item: Item): React.CSSProperties | undefined => {
    if (!statusColumn) return undefined;
    
    const cell = item.cells?.[statusColumn.id];
    if (!cell) return undefined;
    
    const statusValue = typeof cell === 'object' && 'value' in cell ? String(cell.value) : String(cell);
    if (!statusValue) return undefined;
    
    return getStatusColorStyle(statusValue, statusColumn);
  };

  const getItemsForDateRange = (start: Date, end: Date): Item[] => {
    if (!dateColumn) return [];
    
    return items.filter(item => {
      const { start: itemStart, end: itemEnd } = getItemDateRange(item);
      
      if (!itemStart) return false;
      
      // Check if item range overlaps with the requested range
      if (itemEnd) {
        // Item has a range - check for overlap
        return (
          (itemStart <= end && itemEnd >= start) ||
          isWithinInterval(itemStart, { start, end }) ||
          isWithinInterval(itemEnd, { start, end })
        );
      }
      
      // Single day item - check if it falls within range
      return isWithinInterval(itemStart, { start, end });
    });
  };

  const getAllItems = (): Array<{ item: Item; date: Date }> => {
    if (!dateColumn) return [];
    
    const result: Array<{ item: Item; date: Date }> = [];
    
    items.forEach(item => {
      const cell = item.cells?.[dateColumn.id];
      if (!cell) return;
      
      const cellValue = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
      if (!cellValue) return;
      
      try {
        const itemDate = new Date(cellValue as string);
        result.push({ item, date: itemDate });
      } catch {
        // Ignore invalid dates
      }
    });
    
    // Sort by date
    result.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return result;
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    switch (viewMode) {
      case 'month':
        setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
        break;
      case 'agenda':
        // For agenda, we can navigate by month or week
        setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
        break;
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        if (isSameMonth(weekStart, weekEnd)) {
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
        }
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'agenda':
        return format(currentDate, 'MMMM yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const isWorkingDay = (date: Date): boolean => {
    if (!workingDaysOnly) return true;
    return !isWeekend(date);
  };

  const saveSettings = () => {
    const prefs = {
      dateColumns: selectedDateColumns,
      workingDaysOnly,
      showTimeSlots,
    };
    localStorage.setItem(`calendarSettings_${boardId}`, JSON.stringify(prefs));
    setSettingsOpen(false);
    
    // Update date column if selection changed
    const dateCols = columns.filter(
      col => (col.type === 'DATE' || col.type === 'DATETIME' || col.type === 'TIMELINE') && !col.isHidden
    );
    const primaryCol = dateCols.find(col => col.id === selectedDateColumns[0]) || dateCols[0] || null;
    setDateColumn(primaryCol);
  };

  const availableDateColumns = columns.filter(
    col => (col.type === 'DATE' || col.type === 'DATETIME' || col.type === 'TIMELINE') && !col.isHidden
  );

  // Render Month View
  const renderMonthView = (dateCol?: Column | null) => {
    const col = dateCol || dateColumn;
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    let days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Filter working days if enabled
    if (workingDaysOnly) {
      days = days.filter(day => isWorkingDay(day) || !isSameMonth(day, currentDate));
    }
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const getItemsForDateWithColumn = (date: Date, column: Column | null): Item[] => {
      if (!column) return [];
      
      return items.filter(item => {
        const cell = item.cells?.[column.id];
        if (!cell) return false;
        
        const cellValue = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
        if (!cellValue) return false;
        
        try {
          const itemDate = new Date(cellValue as string);
          return isSameDay(itemDate, date);
        } catch {
          return false;
        }
      });
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-slate-50">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-slate-700">
              {day}
            </div>
          ))}
        </div>
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayItems = col ? getItemsForDateWithColumn(day, col) : getItemsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isWeekendDay = isWeekend(day);

            return (
              <div
                key={idx}
                className={cn(
                  'min-h-[100px] border border-slate-200 p-2 transition-colors',
                  !isCurrentMonth && 'bg-slate-50',
                  isToday && 'bg-blue-50 border-blue-300',
                  isSelected && 'bg-blue-100',
                  workingDaysOnly && isWeekendDay && isCurrentMonth && 'bg-slate-100 opacity-50',
                  'hover:bg-slate-50 cursor-pointer'
                )}
                onClick={() => setSelectedDate(day)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (draggedItem) {
                    e.currentTarget.classList.add('bg-blue-50', 'border-blue-400');
                  }
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('bg-blue-50', 'border-blue-400');
                  
                  if (draggedItem && dateColumn) {
                    try {
                      // Update item's date to the dropped day
                      const newDate = new Date(day);
                      newDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                      
                      await boardAPI.updateItemCell(boardId, draggedItem.item.id, dateColumn.id, newDate.toISOString());
                      
                      toast({
                        title: 'Success',
                        description: 'Item date updated',
                      });
                      
                      fetchItems();
                    } catch (error) {
                      console.error('Error updating item date:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to update item date',
                        variant: 'destructive',
                      });
                    }
                  }
                  
                  setDraggedItem(null);
                }}
              >
                <div className={cn(
                  'text-sm font-medium mb-1',
                  !isCurrentMonth && 'text-slate-400',
                  isToday && 'text-blue-600 font-bold'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map(item => {
                    const itemColor = getItemColor(item);
                    const { start, end } = getItemDateRange(item);
                    const isRange = end && !isSameDay(start!, end);
                    const showTime = showTimeSlots && col?.type === 'DATETIME' && start;
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "text-xs rounded px-1 py-0.5 truncate cursor-pointer transition-all",
                          !itemColor && "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        )}
                        style={itemColor}
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemEdit?.(item);
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('application/json', JSON.stringify({ itemId: item.id }));
                          setDraggedItem({ item, originalDate: start || new Date() });
                        }}
                        onDragEnd={() => {
                          setDraggedItem(null);
                        }}
                        draggable
                        title={`${item.name}${isRange ? ` (${format(start!, 'MMM d')} - ${format(end!, 'MMM d')})` : ''}${showTime ? ` - ${format(start!, 'h:mm a')}` : ''}`}
                      >
                        <div className="truncate">{item.name}</div>
                        {showTime && start && (
                          <div className="text-[10px] opacity-75 mt-0.5">
                            {format(start, 'h:mm a')}
                          </div>
                        )}
                        {isRange && <span className="ml-1">→</span>}
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    let weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Filter working days if enabled
    if (workingDaysOnly) {
      weekDays = weekDays.filter(day => isWorkingDay(day));
    }
    
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className={`grid border-b bg-slate-50`} style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(120px, 1fr))` }}>
          <div className="p-2 text-center text-sm font-semibold text-slate-700 border-r">Time</div>
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'p-2 text-center text-sm font-semibold text-slate-700 border-r',
                  isToday && 'bg-blue-50'
                )}
              >
                <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                <div className={cn('font-bold', isToday && 'text-blue-600')}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(120px, 1fr))` }}>
            {hours.map(hour => (
              <React.Fragment key={hour}>
                <div className="p-2 text-xs text-muted-foreground border-r border-b text-right">
                  {(() => {
                    const date = new Date();
                    date.setHours(hour, 0, 0, 0);
                    return format(date, 'h:mm a');
                  })()}
                </div>
                {weekDays.map(day => {
                  const dayStart = startOfDay(day);
                  const hourStart = new Date(dayStart);
                  hourStart.setHours(hour, 0, 0, 0);
                  const hourEnd = new Date(dayStart);
                  hourEnd.setHours(hour + 1, 0, 0, 0);
                  const hourItems = getItemsForDateRange(hourStart, hourEnd);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={cn(
                        'min-h-[60px] border-r border-b p-1',
                        isToday && 'bg-blue-50/30'
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedItem) {
                          e.currentTarget.classList.add('bg-blue-50');
                        }
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-50');
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('bg-blue-50');
                        
                        if (draggedItem && dateColumn) {
                          try {
                            // Update item's date to the dropped day and hour
                            const newDate = new Date(day);
                            newDate.setHours(hour, 0, 0, 0);
                            
                            await boardAPI.updateItemCell(boardId, draggedItem.item.id, dateColumn.id, newDate.toISOString());
                            
                            toast({
                              title: 'Success',
                              description: 'Item date updated',
                            });
                            
                            fetchItems();
                          } catch (error) {
                            console.error('Error updating item date:', error);
                            toast({
                              title: 'Error',
                              description: 'Failed to update item date',
                              variant: 'destructive',
                            });
                          }
                        }
                        
                        setDraggedItem(null);
                      }}
                    >
                      {hourItems.map(item => {
                        const itemColor = getItemColor(item);
                        const { start, end } = getItemDateRange(item);
                        const isRange = end && !isSameDay(start!, end);
                        const showTime = showTimeSlots && dateColumn?.type === 'DATETIME' && start;
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "text-xs rounded px-1 py-0.5 mb-1 truncate cursor-pointer transition-all",
                              !itemColor && "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            )}
                            style={itemColor}
                            onClick={() => onItemEdit?.(item)}
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('application/json', JSON.stringify({ itemId: item.id }));
                              setDraggedItem({ item, originalDate: start || new Date() });
                            }}
                            onDragEnd={() => {
                              setDraggedItem(null);
                            }}
                            draggable
                            title={`${item.name}${isRange ? ` (${format(start!, 'MMM d')} - ${format(end!, 'MMM d')})` : ''}${showTime ? ` - ${format(start!, 'h:mm a')}` : ''}`}
                          >
                            <div className="truncate">{item.name}</div>
                            {showTime && start && (
                              <div className="text-[10px] opacity-75 mt-0.5">
                                {format(start, 'h:mm a')}
                              </div>
                            )}
                            {isRange && <span className="ml-1">→</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Day View
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayItems = getItemsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className={cn(
          'p-4 border-b bg-slate-50',
          isToday && 'bg-blue-50'
        )}>
          <div className="text-sm text-muted-foreground">{format(currentDate, 'EEEE')}</div>
          <div className={cn('text-2xl font-bold', isToday && 'text-blue-600')}>
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          <div className="grid grid-cols-2">
            {hours.map(hour => {
              const hourStart = new Date(currentDate);
              hourStart.setHours(hour, 0, 0, 0);
              const hourEnd = new Date(currentDate);
              hourEnd.setHours(hour + 1, 0, 0, 0);
              const hourItems = getItemsForDateRange(hourStart, hourEnd);

              return (
                <React.Fragment key={hour}>
                  <div className="p-2 text-xs text-muted-foreground border-r border-b text-right">
                    {format(hourStart, 'h:mm a')}
                  </div>
                  <div
                    className="min-h-[60px] border-b p-2"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (draggedItem) {
                        e.currentTarget.classList.add('bg-blue-50');
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-blue-50');
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('bg-blue-50');
                      
                      if (draggedItem && dateColumn) {
                        try {
                          // Update item's date to the dropped hour
                          const newDate = new Date(currentDate);
                          newDate.setHours(hour, 0, 0, 0);
                          
                          await boardAPI.updateItemCell(boardId, draggedItem.item.id, dateColumn.id, newDate.toISOString());
                          
                          toast({
                            title: 'Success',
                            description: 'Item date updated',
                          });
                          
                          fetchItems();
                        } catch (error) {
                          console.error('Error updating item date:', error);
                          toast({
                            title: 'Error',
                            description: 'Failed to update item date',
                            variant: 'destructive',
                          });
                        }
                      }
                      
                      setDraggedItem(null);
                    }}
                  >
                    {hourItems.map(item => {
                      const itemColor = getItemColor(item);
                      const { start, end } = getItemDateRange(item);
                      const isRange = end && !isSameDay(start!, end);
                      const showTime = showTimeSlots && dateColumn?.type === 'DATETIME' && start;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "text-sm rounded px-2 py-1 mb-1 cursor-pointer transition-all",
                            !itemColor && "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          )}
                          style={itemColor}
                          onClick={() => onItemEdit?.(item)}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('application/json', JSON.stringify({ itemId: item.id }));
                            setDraggedItem({ item, originalDate: start || new Date() });
                          }}
                          onDragEnd={() => {
                            setDraggedItem(null);
                          }}
                          draggable
                          title={`${item.name}${isRange ? ` (${format(start!, 'MMM d')} - ${format(end!, 'MMM d')})` : ''}${showTime ? ` - ${format(start!, 'h:mm a')}` : ''}`}
                        >
                          <div className="font-semibold">{item.name}</div>
                          {showTime && start && (
                            <div className="text-xs opacity-75 mt-0.5">
                              {format(start, 'h:mm a')}
                            </div>
                          )}
                          {item.status && (
                            <div className="text-xs text-muted-foreground mt-1">{item.status}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Agenda View (List)
  const renderAgendaView = () => {
    const allItems = getAllItems();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Filter items for current month
    const monthItems = allItems.filter(({ date }) =>
      isWithinInterval(date, { start: monthStart, end: monthEnd })
    );

    // Group by date
    const itemsByDate = new Map<string, Item[]>();
    monthItems.forEach(({ item, date }) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, []);
      }
      itemsByDate.get(dateKey)!.push(item);
    });

    const sortedDates = Array.from(itemsByDate.keys()).sort();

    if (sortedDates.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No items scheduled for this month.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedDates.map(dateKey => {
          const date = new Date(dateKey);
          const dayItems = itemsByDate.get(dateKey) || [];
          const isToday = isSameDay(date, new Date());

          return (
            <div key={dateKey} className="border rounded-lg overflow-hidden">
              <div className={cn(
                'p-3 bg-slate-50 border-b',
                isToday && 'bg-blue-50 border-blue-200'
              )}>
                <div className="text-sm font-semibold text-slate-700">
                  {format(date, 'EEEE, MMMM d, yyyy')}
                  {isToday && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Today
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {dayItems.length} {dayItems.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              <div className="divide-y">
                {dayItems.map(item => {
                  const itemColor = getItemColor(item);
                  const { start, end } = getItemDateRange(item);
                  const isRange = end && !isSameDay(start!, end);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 hover:bg-slate-50 cursor-pointer transition-colors border-l-4",
                        !itemColor && "border-l-blue-500"
                      )}
                      style={itemColor ? { borderLeftColor: itemColor.borderColor || itemColor.color } : undefined}
                      onClick={() => onItemEdit?.(item)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1">{item.name}</div>
                          {isRange && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {format(start!, 'MMM d')} - {format(end!, 'MMM d, yyyy')}
                            </div>
                          )}
                          {item.status && (
                            <Badge variant="outline" className="text-xs">
                              {item.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            try {
                              if (start) {
                                return format(start, 'h:mm a');
                              }
                              return '';
                            } catch {
                              return '';
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
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

  if (!dateColumn) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Date Column Found</h3>
          <p className="text-muted-foreground mb-4">
            Calendar view requires a DATE or DATETIME column. Please create one to use this view.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5" />
            <span>{getViewTitle()}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: 'month' | 'week' | 'day' | 'agenda') => setViewMode(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    <span>Month</span>
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>Week</span>
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Day</span>
                  </div>
                </SelectItem>
                <SelectItem value="agenda">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    <span>Agenda</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('today')}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
      
      {/* Calendar Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Calendar Settings
            </DialogTitle>
            <DialogDescription>
              Customize how items are displayed in the calendar view.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Date Columns to Display</Label>
              <p className="text-xs text-muted-foreground">
                Select one or more date columns to plot on the calendar. Multiple columns will show side-by-side in month view.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {availableDateColumns.map(col => (
                  <div key={col.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`date-col-${col.id}`}
                      checked={selectedDateColumns.includes(col.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDateColumns(prev => [...prev, col.id]);
                        } else {
                          setSelectedDateColumns(prev => prev.filter(id => id !== col.id));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`date-col-${col.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {col.name}
                      <Badge variant="secondary" className="ml-2 text-xs font-normal">
                        {col.type}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
              {selectedDateColumns.length === 0 && (
                <p className="text-xs text-red-500">At least one date column must be selected.</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="working-days-only"
                  checked={workingDaysOnly}
                  onCheckedChange={(checked) => setWorkingDaysOnly(checked as boolean)}
                />
                <Label
                  htmlFor="working-days-only"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Show Working Days Only
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Hide weekends (Saturday and Sunday) from the calendar view.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-time-slots"
                  checked={showTimeSlots}
                  onCheckedChange={(checked) => setShowTimeSlots(checked as boolean)}
                />
                <Label
                  htmlFor="show-time-slots"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Show Time Slots
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Display time information for DATETIME columns on calendar items.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={selectedDateColumns.length === 0}>
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <CardContent>
        {selectedDateColumns.length > 1 && viewMode === 'month' ? (
          // Multiple calendars side by side
          <div className="grid grid-cols-1 gap-4">
            {selectedDateColumns.map((colId, idx) => {
              const col = availableDateColumns.find(c => c.id === colId);
              if (!col) return null;
              return (
                <div key={colId} className="border rounded-lg p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{col.name}</h3>
                    <Badge variant="outline">{col.type}</Badge>
                  </div>
                  {renderMonthView(col)}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'agenda' && renderAgendaView()}
          </>
        )}

        {selectedDate && viewMode === 'month' && getItemsForDate(selectedDate).length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">
                Items on {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getItemsForDate(selectedDate).map(item => {
                  const itemColor = getItemColor(item);
                  const { start, end } = getItemDateRange(item);
                  const isRange = end && !isSameDay(start!, end);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer border-l-4",
                        !itemColor && "border-l-blue-500"
                      )}
                      style={itemColor ? { borderLeftColor: itemColor.borderColor || itemColor.color } : undefined}
                      onClick={() => onItemEdit?.(item)}
                    >
                      <div className="flex-1">
                        <span className="font-medium text-sm">{item.name}</span>
                        {isRange && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(start!, 'MMM d')} - {format(end!, 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                      {item.status && (
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

