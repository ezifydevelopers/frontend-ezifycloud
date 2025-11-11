// People field component for PEOPLE column type

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Column } from '@/types/workspace';
import { X } from 'lucide-react';

interface PeopleFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
}

export const PeopleField: React.FC<PeopleFieldProps> = ({
  column,
  fieldName,
  control,
  setValue,
  errors,
  workspaceMembers,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;
  const [searchTerm, setSearchTerm] = useState('');
  const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
  const isMultiple = peopleSettings?.peopleType === 'multiple';

  const filteredMembers = workspaceMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to find user by email
  const findUserByEmail = (email: string) => {
    return workspaceMembers.find(m => 
      m.email.toLowerCase() === email.toLowerCase()
    );
  };

  return (
    <div className="space-y-2">
      <Label>
        {column.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={fieldName}
        control={control}
        render={({ field, fieldState }) => {
          // Handle case where user might have typed an email directly
          const fieldValue = field.value;
          let selectedIds: string[] = [];
          
          if (isMultiple) {
            selectedIds = Array.isArray(fieldValue) ? fieldValue : fieldValue ? [fieldValue] : [];
          } else {
            if (fieldValue) {
              // Check if it's an email address
              if (typeof fieldValue === 'string' && fieldValue.includes('@')) {
                const user = findUserByEmail(fieldValue);
                if (user) {
                  selectedIds = [user.id];
                  // Update the field value to use the user ID instead of email
                  if (field.value !== user.id) {
                    setValue(fieldName, user.id, { shouldValidate: true });
                  }
                } else {
                  // Email not found in workspace members - keep the email for now
                  // but mark as invalid so user knows to select from dropdown
                  selectedIds = [];
                }
              } else {
                // Check if it's a valid user ID
                const user = workspaceMembers.find(m => m.id === fieldValue);
                if (user) {
                  selectedIds = [fieldValue];
                } else {
                  selectedIds = [];
                }
              }
            }
          }
          
          const selectedMembers = workspaceMembers.filter(m => selectedIds.includes(m.id));

          const toggleMember = (memberId: string) => {
            if (isMultiple) {
              const current = Array.isArray(field.value) ? field.value : field.value ? [field.value] : [];
              if (current.includes(memberId)) {
                setValue(fieldName, current.filter((id: string) => id !== memberId));
              } else {
                setValue(fieldName, [...current, memberId]);
              }
            } else {
              setValue(fieldName, field.value === memberId ? '' : memberId);
            }
          };

          return (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedMembers.length === 0
                      ? `Select ${column.name.toLowerCase()}...`
                      : selectedMembers.map(m => m.name).join(', ')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="p-3 border-b">
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {filteredMembers.map((member) => {
                      const isSelected = selectedIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded cursor-pointer"
                          onClick={() => toggleMember(member.id)}
                        >
                          <Checkbox checked={isSelected} />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profilePicture} />
                            <AvatarFallback>
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-md"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleMember(member.id)}
                        className="ml-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        }}
      />
      {error && (
        <p className="text-sm text-destructive">
          {error.message as string || 
            (control._formValues && control._formValues[fieldName] && 
             typeof control._formValues[fieldName] === 'string' && 
             control._formValues[fieldName].includes('@')
              ? `Email "${control._formValues[fieldName]}" not found in workspace. Please click the field to select a user from the dropdown.`
              : 'Please select a user from the dropdown list.')}
        </p>
      )}
    </div>
  );
};

