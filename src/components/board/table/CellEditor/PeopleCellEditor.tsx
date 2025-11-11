// People cell editor

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Column } from '@/types/workspace';

interface PeopleCellEditorProps {
  column: Column;
  value: unknown;
  onChange?: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
}

export const PeopleCellEditor: React.FC<PeopleCellEditorProps> = ({
  column,
  value,
  onChange,
  onSave,
  onCancel,
  disabled = false,
  workspaceMembers,
}) => {
  const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
  const isMultiple = peopleSettings?.peopleType === 'multiple';
  const currentUserIds = Array.isArray(value) 
    ? value.map(id => String(id))
    : value 
    ? [String(value)]
    : [];

  return (
    <div className="flex items-center gap-1">
      <Select
        value={isMultiple ? '' : (String(value || ''))}
        onValueChange={(val) => {
          if (isMultiple) {
            const newValues = currentUserIds.includes(val)
              ? currentUserIds.filter(id => id !== val)
              : [...currentUserIds, val];
            onChange?.(newValues);
          } else {
            onChange?.(val);
          }
          onSave();
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 text-sm min-w-[150px]">
          <SelectValue placeholder={isMultiple ? `${currentUserIds.length} selected` : 'Select person'} />
        </SelectTrigger>
        <SelectContent>
          {workspaceMembers.map((member) => {
            const isSelected = isMultiple ? currentUserIds.includes(member.id) : value === member.id;
            return (
              <SelectItem 
                key={member.id} 
                value={member.id}
                className={isSelected ? 'bg-blue-50' : ''}
              >
                <div className="flex items-center gap-2">
                  {isMultiple && <Checkbox checked={isSelected} />}
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={member.profilePicture} />
                    <AvatarFallback className="text-xs">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
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

