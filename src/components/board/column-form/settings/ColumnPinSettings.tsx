// Column pin settings - pin column to left or right

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Pin, PinOff } from 'lucide-react';

interface ColumnPinSettingsProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export const ColumnPinSettings: React.FC<ColumnPinSettingsProps> = ({
  watch,
  setValue,
}) => {
  const pinSide = watch('pinSide') as 'left' | 'right' | null | undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor="pinSide">Pin Column Position</Label>
      <Select
        value={pinSide || 'none'}
        onValueChange={(value) => {
          setValue('pinSide', value === 'none' ? null : value);
        }}
      >
        <SelectTrigger id="pinSide">
          <SelectValue placeholder="Select pin position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <PinOff className="h-4 w-4" />
              Not Pinned
            </div>
          </SelectItem>
          <SelectItem value="left">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Pin to Left
            </div>
          </SelectItem>
          <SelectItem value="right">
            <div className="flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Pin to Right
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Pinned columns stay visible when scrolling horizontally. Left-pinned columns appear on the left side, right-pinned columns on the right.
      </p>
    </div>
  );
};

