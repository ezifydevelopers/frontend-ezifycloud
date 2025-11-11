// Currency settings component

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'SGD', 'AED', 'CHF', 'NZD', 'BRL', 'MXN', 'ZAR'];

interface CurrencySettingsProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({
  watch,
  setValue,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="currency">
        Currency <span className="text-destructive">*</span>
      </Label>
      <Select
        value={watch('currency') || 'USD'}
        onValueChange={(value) => setValue('currency', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((curr) => (
            <SelectItem key={curr} value={curr}>
              {curr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

