// Field renderer dispatcher - routes to appropriate field component based on column type

import React from 'react';
import { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { Column, Item } from '@/types/workspace';
import {
  TextField,
  LongTextField,
  NumberField,
  DateField,
  CheckboxField,
  DropdownField,
  RadioField,
  MultiSelectField,
  RatingField,
  PeopleField,
  FileField,
  TimelineField,
  AutoNumberField,
} from './fields';

interface ItemFieldRendererProps {
  column: Column;
  fieldName: string;
  register: UseFormRegister<any>;
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
  item?: Item | null;
}

export const ItemFieldRenderer: React.FC<ItemFieldRendererProps> = ({
  column,
  fieldName,
  register,
  control,
  setValue,
  errors,
  workspaceMembers,
  item,
}) => {
  switch (column.type) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'LINK':
      return (
        <TextField
          column={column}
          fieldName={fieldName}
          register={register}
          errors={errors}
        />
      );

    case 'LONG_TEXT':
      return (
        <LongTextField
          column={column}
          fieldName={fieldName}
          register={register}
          errors={errors}
        />
      );

    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      return (
        <NumberField
          column={column}
          fieldName={fieldName}
          register={register}
          setValue={setValue}
          errors={errors}
        />
      );

    case 'DATE':
    case 'DATETIME':
    case 'WEEK':
    case 'MONTH':
    case 'YEAR':
      return (
        <DateField
          column={column}
          fieldName={fieldName}
          register={register}
          errors={errors}
        />
      );

    case 'TIMELINE':
      return (
        <TimelineField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    case 'CHECKBOX':
      return (
        <CheckboxField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    case 'DROPDOWN':
    case 'STATUS':
      return (
        <DropdownField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    case 'RADIO':
      return (
        <RadioField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    case 'MULTI_SELECT':
      return (
        <MultiSelectField
          column={column}
          fieldName={fieldName}
          control={control}
          setValue={setValue}
          errors={errors}
        />
      );

    case 'RATING':
      return (
        <RatingField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    case 'PEOPLE':
      return (
        <PeopleField
          column={column}
          fieldName={fieldName}
          control={control}
          setValue={setValue}
          errors={errors}
          workspaceMembers={workspaceMembers}
        />
      );

    case 'FILE':
      return (
        <FileField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
          item={item}
        />
      );

    case 'AUTO_NUMBER':
      return (
        <AutoNumberField
          column={column}
          fieldName={fieldName}
        />
      );

    case 'VOTE':
      return (
        <VoteField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    case 'PROGRESS':
      return (
        <ProgressField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    case 'LOCATION':
      return (
        <LocationField
          column={column}
          fieldName={fieldName}
          control={control}
          errors={errors}
        />
      );

    // TODO: Handle FORMULA, MIRROR
    default:
      return (
        <TextField
          column={column}
          fieldName={fieldName}
          register={register}
          errors={errors}
        />
      );
  }
};

