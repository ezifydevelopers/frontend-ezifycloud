// Kanban settings dialog for customization

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Column } from '@/types/workspace';
import { Settings } from 'lucide-react';

export interface KanbanSettings {
  groupBy?: string; // Column ID for grouping
  swimlaneBy?: string; // Column ID for swimlanes
  showKeyFields?: string[]; // Column IDs to show as key fields
  showFields?: string[]; // Column IDs to show on cards (all fields if not specified)
  cardColors?: Record<string, string>; // Column ID -> color mapping
  wipLimits?: Record<string, number>; // Column ID -> WIP limit
  cardSize?: 'compact' | 'normal' | 'large'; // Card size preference
  cardOrder?: string; // Column ID to sort cards by
  cardOrderDirection?: 'asc' | 'desc'; // Sort direction
}

interface KanbanSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  settings: KanbanSettings;
  onSettingsChange: (settings: KanbanSettings) => void;
}

export const KanbanSettingsDialog: React.FC<KanbanSettingsProps> = ({
  open,
  onOpenChange,
  columns,
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState<KanbanSettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleGroupByChange = (columnId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      groupBy: columnId === 'none' ? undefined : columnId,
    }));
  };

  const handleSwimlaneByChange = (columnId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      swimlaneBy: columnId === 'none' ? undefined : columnId,
    }));
  };

  const handleWipLimitChange = (columnId: string, limit: number | null) => {
    setLocalSettings(prev => ({
      ...prev,
      wipLimits: {
        ...prev.wipLimits,
        [columnId]: limit || undefined,
      },
    }));
  };

  const handleKeyFieldToggle = (columnId: string, checked: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      showKeyFields: checked
        ? [...(prev.showKeyFields || []), columnId]
        : (prev.showKeyFields || []).filter(id => id !== columnId),
    }));
  };

  // Get status columns for grouping
  const statusColumns = columns.filter(col => col.type === 'STATUS' && !col.isHidden);
  const groupableColumns = columns.filter(col => 
    !col.isHidden && 
    (col.type === 'STATUS' || col.type === 'DROPDOWN' || col.type === 'PEOPLE')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kanban Settings
          </DialogTitle>
          <DialogDescription>
            Customize how items are displayed and organized in the Kanban view.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="grouping" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="grouping">Grouping</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="ordering">Ordering</TabsTrigger>
            <TabsTrigger value="limits">WIP Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="grouping" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Group By Column</Label>
              <Select
                value={localSettings.groupBy || 'none'}
                onValueChange={handleGroupByChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Default Status)</SelectItem>
                  {groupableColumns.map(col => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.name} ({col.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Items will be grouped into columns based on this column's values.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Swimlanes (Group By)</Label>
              <Select
                value={localSettings.swimlaneBy || 'none'}
                onValueChange={handleSwimlaneByChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {columns
                    .filter(col => 
                      !col.isHidden && 
                      col.type !== 'STATUS' &&
                      (col.type === 'PEOPLE' || col.type === 'DROPDOWN' || col.type === 'TEXT')
                    )
                    .map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Create horizontal swimlanes grouped by this column's values.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Card Size</Label>
              <Select
                value={localSettings.cardSize || 'normal'}
                onValueChange={(value: 'compact' | 'normal' | 'large') => {
                  setLocalSettings(prev => ({ ...prev, cardSize: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the size of cards in the Kanban view.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Key Fields to Display</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select columns to display prominently on cards (with icons).
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {columns
                  .filter(col => 
                    !col.isHidden && 
                    col.id !== localSettings.groupBy &&
                    col.type !== 'LONG_TEXT'
                  )
                  .map(col => (
                    <div key={col.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`key-field-${col.id}`}
                        checked={localSettings.showKeyFields?.includes(col.id) || false}
                        onCheckedChange={(checked) => 
                          handleKeyFieldToggle(col.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`key-field-${col.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {col.name} ({col.type})
                      </Label>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Fields to Display</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select columns to display on cards (less prominent). Leave empty to show all fields.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {columns
                  .filter(col => 
                    !col.isHidden && 
                    col.id !== localSettings.groupBy &&
                    col.type !== 'LONG_TEXT' &&
                    !localSettings.showKeyFields?.includes(col.id)
                  )
                  .map(col => {
                    const isChecked = localSettings.showFields?.includes(col.id) ?? true; // Default to true
                    return (
                      <div key={col.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`field-${col.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setLocalSettings(prev => {
                              const currentFields = prev.showFields || [];
                              const newFields = checked
                                ? [...currentFields, col.id]
                                : currentFields.filter(id => id !== col.id);
                              return {
                                ...prev,
                                showFields: newFields.length > 0 ? newFields : undefined,
                              };
                            });
                          }}
                        />
                        <Label
                          htmlFor={`field-${col.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {col.name} ({col.type})
                        </Label>
                      </div>
                    );
                  })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ordering" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Sort Cards By</Label>
              <Select
                value={localSettings.cardOrder || 'none'}
                onValueChange={(value) => {
                  setLocalSettings(prev => ({
                    ...prev,
                    cardOrder: value === 'none' ? undefined : value,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Default order)</SelectItem>
                  {columns
                    .filter(col => 
                      !col.isHidden && 
                      col.type !== 'LONG_TEXT' &&
                      (col.type === 'DATE' || 
                       col.type === 'DATETIME' || 
                       col.type === 'NUMBER' || 
                       col.type === 'CURRENCY' ||
                       col.type === 'TEXT' ||
                       col.type === 'AUTO_NUMBER')
                    )
                    .map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cards will be sorted within each column by this field.
              </p>
            </div>

            {localSettings.cardOrder && (
              <div className="space-y-2">
                <Label>Sort Direction</Label>
                <Select
                  value={localSettings.cardOrderDirection || 'asc'}
                  onValueChange={(value: 'asc' | 'desc') => {
                    setLocalSettings(prev => ({
                      ...prev,
                      cardOrderDirection: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="limits" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Work In Progress (WIP) Limits</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Set maximum number of items allowed in each column.
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto border rounded p-3">
                {statusColumns.map(col => {
                  const limit = localSettings.wipLimits?.[col.id] || 0;
                  return (
                    <div key={col.id} className="flex items-center justify-between">
                      <Label className="text-sm">{col.name}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={limit || ''}
                        onChange={(e) => 
                          handleWipLimitChange(col.id, e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        className="w-20"
                        placeholder="No limit"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

