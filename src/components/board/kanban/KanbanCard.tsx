// Kanban card component with enhanced preview and color customization

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Hash,
  FileText,
} from 'lucide-react';
import { Item, Column } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { getStatusColorStyle } from '../table/utils/cellValueFormatter';
import { formatCellValue } from '../table/utils/cellValueFormatter';

interface KanbanCardProps {
  item: Item;
  columns: Column[];
  statusColumn?: Column | null;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  cardColor?: string;
  showKeyFields?: string[]; // Column IDs to show as key fields
  showFields?: string[]; // Column IDs to show on cards
  cardSize?: 'compact' | 'normal' | 'large'; // Card size
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  item,
  columns,
  statusColumn,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
  cardColor,
  showKeyFields = [],
  showFields,
  cardSize = 'normal',
}) => {
  // Card size styles
  const sizeStyles = {
    compact: {
      padding: 'p-2',
      title: 'text-xs',
      field: 'text-[10px]',
      icon: 'h-2.5 w-2.5',
      gap: 'gap-1',
    },
    normal: {
      padding: 'p-3',
      title: 'text-sm',
      field: 'text-xs',
      icon: 'h-3 w-3',
      gap: 'gap-1.5',
    },
    large: {
      padding: 'p-4',
      title: 'text-base',
      field: 'text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-2',
    },
  };

  const styles = sizeStyles[cardSize];
  // Get card color from status or custom
  const getCardColor = () => {
    if (cardColor) return cardColor;
    
    if (statusColumn) {
      const cellValue = item.cells?.[statusColumn.id];
      const status = cellValue 
        ? (typeof cellValue === 'object' && 'value' in cellValue ? cellValue.value : cellValue)
        : item.status;
      
      if (status) {
        const colorStyle = getStatusColorStyle(String(status), statusColumn);
        return colorStyle?.backgroundColor || colorStyle?.borderColor;
      }
    }
    
    return undefined;
  };

  const cardBgColor = getCardColor();

  // Get key fields to display prominently
  const getKeyFields = () => {
    if (showKeyFields.length > 0) {
      return showKeyFields
        .map(colId => columns.find(c => c.id === colId))
        .filter(Boolean) as Column[];
    }
    
    // Default: show first 2-3 important columns
    return columns
      .filter(col => 
        col.id !== statusColumn?.id && 
        !col.isHidden && 
        col.type !== 'LONG_TEXT' &&
        (col.type === 'CURRENCY' || 
         col.type === 'DATE' || 
         col.type === 'DATETIME' ||
         col.type === 'PEOPLE' ||
         col.type === 'NUMBER')
      )
      .slice(0, 3);
  };

  const keyFields = getKeyFields();

  // Get icon for column type
  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'DATE':
      case 'DATETIME':
        return Calendar;
      case 'CURRENCY':
      case 'NUMBER':
        return DollarSign;
      case 'PEOPLE':
        return User;
      case 'AUTO_NUMBER':
        return Hash;
      default:
        return FileText;
    }
  };

  return (
    <Card
      className={cn(
        "mb-3 hover:shadow-md transition-all cursor-move border select-none",
        isDragging && "opacity-50 scale-95 shadow-lg z-50",
        !isDragging && "hover:scale-[1.02]"
      )}
      style={{
        backgroundColor: cardBgColor || undefined,
        borderLeftWidth: cardBgColor ? '4px' : undefined,
        borderLeftColor: cardBgColor || undefined,
      }}
      draggable={true}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        onDragEnd(e);
      }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          e.stopPropagation();
        }
      }}
    >
      <CardContent className={styles.padding}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${styles.title} mb-2 truncate`}>{item.name}</h4>
            
            {/* Key Fields - Prominently displayed */}
            {keyFields.length > 0 && (
              <div className={`space-y-1.5 mb-2`}>
                {keyFields.map((col) => {
                  const cell = item.cells?.[col.id];
                  const value = cell ? (typeof cell === 'object' && 'value' in cell ? cell.value : cell) : null;
                  
                  if (value === null || value === undefined || value === '') return null;
                  
                  const Icon = getColumnIcon(col.type);
                  const formattedValue = formatCellValue(value, col);
                  
                  return (
                    <div key={col.id} className={`flex items-center ${styles.gap} ${styles.field}`}>
                      <Icon className={`${styles.icon} text-muted-foreground flex-shrink-0`} />
                      <span className="font-medium text-muted-foreground">{col.name}:</span>
                      <span className="text-foreground font-semibold">{formattedValue}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Additional Fields - Less prominent */}
            {(() => {
              const fieldsToShow = columns.filter(col => 
                col.id !== statusColumn?.id && 
                !col.isHidden && 
                col.type !== 'LONG_TEXT' &&
                !keyFields.some(kf => kf.id === col.id) &&
                (showFields === undefined || showFields.includes(col.id))
              );
              
              // Limit number of fields based on card size
              const maxFields = cardSize === 'compact' ? 1 : cardSize === 'normal' ? 2 : 3;
              
              return fieldsToShow
                .slice(0, maxFields)
                .map((col) => {
                  const cell = item.cells?.[col.id];
                  const value = cell ? (typeof cell === 'object' && 'value' in cell ? cell.value : cell) : null;
                  
                  if (!value && value !== 0 && value !== false) return null;
                  
                  return (
                    <div key={col.id} className={`${styles.field} text-muted-foreground mb-1`}>
                      <span className="font-medium">{col.name}:</span>{' '}
                      {formatCellValue(value, col)}
                    </div>
                  );
                });
            })()}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger 
              asChild
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 flex-shrink-0"
                onDragStart={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(item)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Status Badge */}
        {item.status && !statusColumn && (
          <Badge variant="outline" className="mt-2 text-xs">
            {item.status}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

