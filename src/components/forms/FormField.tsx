import React from 'react';
import { FieldError } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FormFieldProps {
  label: string;
  id: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  id, 
  error, 
  required = false, 
  children 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
};

interface TextInputProps {
  id: string;
  placeholder?: string;
  type?: string;
  error?: FieldError;
  register: any;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  placeholder,
  type = "text",
  error,
  register,
  className = ""
}) => {
  return (
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      {...register}
      className={`${error ? 'border-destructive' : ''} ${className}`}
    />
  );
};

interface SelectInputProps {
  id: string;
  placeholder: string;
  error?: FieldError;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  placeholder,
  error,
  onValueChange,
  children
}) => {
  return (
    <Select onValueChange={onValueChange}>
      <SelectTrigger className={error ? 'border-destructive' : ''}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
};

interface TextareaInputProps {
  id: string;
  placeholder?: string;
  error?: FieldError;
  register: any;
  className?: string;
  rows?: number;
}

export const TextareaInput: React.FC<TextareaInputProps> = ({
  id,
  placeholder,
  error,
  register,
  className = "",
  rows = 3
}) => {
  return (
    <Textarea
      id={id}
      placeholder={placeholder}
      rows={rows}
      {...register}
      className={`${error ? 'border-destructive' : ''} ${className}`}
    />
  );
};

