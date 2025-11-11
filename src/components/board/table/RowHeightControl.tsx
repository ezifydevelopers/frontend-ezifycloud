// Row height control component

import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Maximize2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RowHeightControlProps {
  rowHeight: number;
  onRowHeightChange: (height: number) => void;
}

export const RowHeightControl: React.FC<RowHeightControlProps> = ({
  rowHeight,
  onRowHeightChange,
}) => {
  const presets = [
    { label: 'Compact', value: 32 },
    { label: 'Normal', value: 40 },
    { label: 'Comfortable', value: 48 },
    { label: 'Spacious', value: 56 },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Maximize2 className="h-4 w-4 mr-2" />
          Row Height
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2">Row Height</Label>
            <div className="space-y-2">
              <Slider
                value={[rowHeight]}
                onValueChange={([value]) => onRowHeightChange(value)}
                min={24}
                max={80}
                step={4}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>24px</span>
                <span className="font-medium">{rowHeight}px</span>
                <span>80px</span>
              </div>
            </div>
          </div>
          <div className="border-t pt-3">
            <Label className="text-xs text-muted-foreground mb-2">Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={rowHeight === preset.value ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => onRowHeightChange(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

