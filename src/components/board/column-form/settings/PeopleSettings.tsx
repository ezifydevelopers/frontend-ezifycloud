// People type settings component

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface PeopleSettingsProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export const PeopleSettings: React.FC<PeopleSettingsProps> = ({
  watch,
  setValue,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="peopleType">People Type</Label>
      <Select
        value={watch('peopleType') || 'single'}
        onValueChange={(value) => setValue('peopleType', value as 'single' | 'multiple')}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single Person (Assignee)</SelectItem>
          <SelectItem value="multiple">Multiple People (Team)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

