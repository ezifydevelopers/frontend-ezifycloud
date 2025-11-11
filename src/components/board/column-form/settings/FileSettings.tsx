// File settings component

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';

interface FileSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
}

export const FileSettings: React.FC<FileSettingsProps> = ({
  register,
  watch,
  setValue,
  errors,
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="fileType">File Type</Label>
        <Select
          value={watch('fileType') || 'single'}
          onValueChange={(value) => setValue('fileType', value as 'single' | 'multiple')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single File Upload</SelectItem>
            <SelectItem value="multiple">Multiple Files</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allowedFileTypes">
          Allowed File Types (Optional)
          <span className="text-xs text-muted-foreground ml-2">
            (e.g., image/*, .pdf, application/pdf, image/png,image/jpeg)
          </span>
        </Label>
        <Input
          id="allowedFileTypes"
          {...register('allowedFileTypes')}
          placeholder="image/*, application/pdf, .doc, .docx"
          className={errors.allowedFileTypes ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to allow all file types. Use MIME types (e.g., image/*, application/pdf) or extensions (e.g., .pdf, .jpg)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
        <Input
          id="maxFileSize"
          type="number"
          {...register('maxFileSize', { 
            valueAsNumber: true,
            min: { value: 0.1, message: 'Minimum 0.1 MB' },
            max: { value: 1000, message: 'Maximum 1000 MB' }
          })}
          placeholder="5"
          className={errors.maxFileSize ? 'border-destructive' : ''}
        />
        {errors.maxFileSize && (
          <p className="text-sm text-destructive">{errors.maxFileSize.message as string}</p>
        )}
      </div>
    </>
  );
};

