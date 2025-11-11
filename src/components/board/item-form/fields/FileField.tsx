// File field component for FILE column type

import React from 'react';
import { Label } from '@/components/ui/label';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { FileColumnUpload } from '../../FileColumnUpload';
import { Column, Item } from '@/types/workspace';

interface FileFieldProps {
  column: Column;
  fieldName: string;
  control: Control<any>;
  errors: FieldErrors;
  item?: Item | null;
}

export const FileField: React.FC<FileFieldProps> = ({
  column,
  fieldName,
  control,
  errors,
  item,
}) => {
  const error = errors[fieldName];
  const isRequired = column.required;
  const fileSettings = column.settings as { fileType?: 'single' | 'multiple'; allowedFileTypes?: string[]; maxFileSize?: number } | undefined;
  const isMultiple = fileSettings?.fileType === 'multiple';
  const allowedFileTypes = fileSettings?.allowedFileTypes || [];
  const maxFileSize = fileSettings?.maxFileSize || 5;

  return (
    <div className="space-y-2">
      <Label>
        {column.name}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => (
          <>
            {item?.id ? (
              <FileColumnUpload
                itemId={item.id}
                columnId={column.id}
                value={field.value as string | string[] | null | undefined}
                fileType={isMultiple ? 'multiple' : 'single'}
                allowedFileTypes={allowedFileTypes}
                maxFileSize={maxFileSize}
                onValueChange={(fileIds) => {
                  field.onChange(fileIds);
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Files can be uploaded after the item is created
              </p>
            )}
          </>
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
};

