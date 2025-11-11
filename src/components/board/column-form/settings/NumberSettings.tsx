// Number type settings component

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface NumberSettingsProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export const NumberSettings: React.FC<NumberSettingsProps> = ({
  watch,
  setValue,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="numberType">Number Type</Label>
      <Select
        value={watch('numberType') || 'decimal'}
        onValueChange={(value) => setValue('numberType', value as 'integer' | 'decimal')}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="integer">Integer (whole numbers only)</SelectItem>
          <SelectItem value="decimal">Decimal (allows decimals)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

