// Timeline cell editor (date range)

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface TimelineCellEditorProps {
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const TimelineCellEditor: React.FC<TimelineCellEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
}) => {
  const [timeline, setTimeline] = React.useState<{ start?: string; end?: string }>(() => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : (value as { start?: string; end?: string } || {});
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value as { start?: string; end?: string } || {};
      setTimeline(parsed);
    } catch {
      setTimeline({});
    }
  }, [value]);
    
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={timeline?.start ? new Date(timeline.start).toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const updated = { ...timeline, start: e.target.value ? new Date(e.target.value).toISOString() : '' };
            setTimeline(updated);
            onChange?.(JSON.stringify(updated));
          }}
          placeholder="Start date"
          className="h-8 text-sm w-32"
          disabled={disabled}
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={timeline?.end ? new Date(timeline.end).toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const updated = { ...timeline, end: e.target.value ? new Date(e.target.value).toISOString() : '' };
            setTimeline(updated);
            onChange?.(JSON.stringify(updated));
          }}
          placeholder="End date"
          className="h-8 text-sm w-32"
          disabled={disabled}
        />
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onSave}
        disabled={disabled}
      >
        <Check className="h-3 w-3 text-green-600" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onCancel}
        disabled={disabled}
      >
        <X className="h-3 w-3 text-red-600" />
      </Button>
    </div>
  );
};
