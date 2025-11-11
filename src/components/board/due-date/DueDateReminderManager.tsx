// Due Date Reminder Manager - Manage reminders for due dates

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Settings, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Item, Column } from '@/types/workspace';
import { getDaysUntilDue, isOverdue, getOverdueStatus } from '@/utils/dueDateUtils';
import { getCellValue } from '../table/utils/tableUtils';

interface DueDateReminder {
  id: string;
  itemId: string;
  itemName: string;
  dueDate: string;
  reminderDays: number[]; // Days before due date to send reminders
  lastReminderSent?: string;
  enabled: boolean;
}

interface DueDateReminderManagerProps {
  items: Item[];
  columns: Column[];
  boardId: string;
}

export const DueDateReminderManager: React.FC<DueDateReminderManagerProps> = ({
  items,
  columns,
  boardId,
}) => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<DueDateReminder[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Find due date column
  const dueDateColumn = columns.find(c => {
    const settings = c.settings as any;
    const name = c.name.toLowerCase();
    return settings?.isDueDate || name.includes('due date') || name.includes('duedate');
  });

  // Get items with due dates
  const itemsWithDueDates = items.filter(item => {
    if (!dueDateColumn) return false;
    const dueDate = getCellValue(item, dueDateColumn.id);
    return dueDate && !isOverdue(String(dueDate)) && getDaysUntilDue(String(dueDate)) !== null;
  }).map(item => ({
    item,
    dueDate: String(getCellValue(item, dueDateColumn!.id)),
    daysUntil: getDaysUntilDue(String(getCellValue(item, dueDateColumn!.id))),
    status: getOverdueStatus(String(getCellValue(item, dueDateColumn!.id))),
  })).sort((a, b) => (a.daysUntil || 999) - (b.daysUntil || 999));

  // Get overdue items
  const overdueItems = items.filter(item => {
    if (!dueDateColumn) return false;
    const dueDate = getCellValue(item, dueDateColumn.id);
    return dueDate && isOverdue(String(dueDate));
  }).map(item => ({
    item,
    dueDate: String(getCellValue(item, dueDateColumn!.id)),
    status: getOverdueStatus(String(getCellValue(item, dueDateColumn!.id))),
  }));

  return (
    <div className="space-y-4">
      {/* Overdue Items Alert */}
      {overdueItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Overdue Invoices ({overdueItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueItems.slice(0, 5).map(({ item, status }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-red-200"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="destructive" className="ml-2">
                      {status.label}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))}
              {overdueItems.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {overdueItems.length - 5} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Due Dates */}
      {itemsWithDueDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Upcoming Due Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {itemsWithDueDates.slice(0, 10).map(({ item, dueDate, daysUntil, status }) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded border ${
                    status.status === 'due_soon' ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                  }`}
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(dueDate).toLocaleDateString()} ({status.label})
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItem(item)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminder Settings Dialog */}
      {selectedItem && dueDateColumn && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Reminder for "{selectedItem.name}"</DialogTitle>
              <DialogDescription>
                Configure when to receive reminders before the due date
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Due Date</Label>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const dueDate = getCellValue(selectedItem, dueDateColumn.id);
                    return dueDate ? new Date(String(dueDate)).toLocaleDateString() : 'Not set';
                  })()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Send Reminder (days before due date)</Label>
                <div className="space-y-2">
                  {[1, 3, 7, 14, 30].map((days) => (
                    <div key={days} className="flex items-center space-x-2">
                      <Checkbox id={`reminder-${days}`} />
                      <Label htmlFor={`reminder-${days}`} className="text-sm">
                        {days} day{days !== 1 ? 's' : ''} before
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: 'Success',
                  description: 'Reminder settings saved',
                });
                setSelectedItem(null);
              }}>
                Save Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

