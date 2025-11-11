import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FileColumnUpload } from './FileColumnUpload';
import { useToast } from '@/hooks/use-toast';
import { boardAPI, workspaceAPI } from '@/lib/api';
import { Column, ColumnType, Item, CreateItemInput } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  columns: Column[];
  item?: Item | null;
  onSuccess?: () => void;
}

// Generate validation schema dynamically based on columns
const createItemSchema = (columns: Column[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    name: z.string().min(1, 'Item name is required'),
    status: z.string().optional(),
  };

  columns.forEach((column) => {
    if (column.required && !column.isHidden) {
      switch (column.type) {
        case 'TEXT':
        case 'LONG_TEXT':
          schemaFields[`cell_${column.id}`] = z.string().min(1, `${column.name} is required`);
          break;
        case 'NUMBER':
        case 'CURRENCY':
          schemaFields[`cell_${column.id}`] = z.union([
            z.number(),
            z.string().transform((val) => {
              if (val === '' || val === null || val === undefined) return undefined;
              const num = Number(val);
              return isNaN(num) ? undefined : num;
            })
          ]).refine((val) => val !== undefined && !isNaN(val), `${column.name} must be a valid number`);
          break;
        case 'DATE':
        case 'DATETIME':
        case 'WEEK':
        case 'MONTH':
        case 'YEAR':
          schemaFields[`cell_${column.id}`] = z.string().min(1, `${column.name} is required`);
          break;
        case 'TIMELINE':
          schemaFields[`cell_${column.id}`] = z.union([
            z.object({ start: z.string().min(1), end: z.string().min(1) }),
            z.string().min(1).transform((val) => {
              try {
                const parsed = JSON.parse(val);
                if (parsed.start && parsed.end) return parsed;
                throw new Error('Invalid timeline format');
              } catch {
                throw new Error('Invalid timeline format');
              }
            })
          ]);
          break;
        case 'CHECKBOX':
          schemaFields[`cell_${column.id}`] = z.boolean();
          break;
        case 'DROPDOWN':
        case 'STATUS':
        case 'RADIO':
        case 'PEOPLE': {
          const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
          if (peopleSettings?.peopleType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string()).min(1, `${column.name} is required`);
          } else {
            schemaFields[`cell_${column.id}`] = z.string().min(1, `${column.name} is required`);
          }
          break;
        }
        case 'FILE': {
          const fileSettings = column.settings as { fileType?: 'single' | 'multiple' } | undefined;
          if (fileSettings?.fileType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string()).min(1, `${column.name} is required`).optional();
          } else {
            schemaFields[`cell_${column.id}`] = z.string().min(1, `${column.name} is required`).optional();
          }
          break;
        }
        default:
          schemaFields[`cell_${column.id}`] = z.any();
      }
    } else if (!column.isHidden) {
      // Optional fields
      switch (column.type) {
        case 'TEXT':
        case 'LONG_TEXT':
          schemaFields[`cell_${column.id}`] = z.string().optional();
          break;
        case 'NUMBER':
        case 'CURRENCY':
        case 'PERCENTAGE':
          schemaFields[`cell_${column.id}`] = z.union([
            z.number(),
            z.string().transform((val) => {
              if (val === '' || val === null || val === undefined) return undefined;
              const num = Number(val);
              return isNaN(num) ? undefined : num;
            })
          ]).optional().refine((val) => val === undefined || (!isNaN(val) && typeof val === 'number'), `${column.name} must be a valid number`);
          if (column.type === 'PERCENTAGE') {
            schemaFields[`cell_${column.id}`] = schemaFields[`cell_${column.id}`].refine(
              (val) => val === undefined || (val >= 0 && val <= 100),
              `${column.name} must be between 0 and 100`
            );
          }
          break;
        case 'RATING':
          schemaFields[`cell_${column.id}`] = z.union([
            z.number(),
            z.string().transform((val) => {
              if (val === '' || val === null || val === undefined) return undefined;
              const num = Number(val);
              return isNaN(num) ? undefined : num;
            })
          ]).optional().refine((val) => val === undefined || (val >= 1 && val <= 5), `${column.name} must be between 1 and 5`);
          break;
        case 'DATE':
        case 'DATETIME':
        case 'WEEK':
        case 'MONTH':
        case 'YEAR':
          schemaFields[`cell_${column.id}`] = z.string().optional();
          break;
        case 'TIMELINE':
          schemaFields[`cell_${column.id}`] = z.union([
            z.object({ start: z.string(), end: z.string() }),
            z.string().transform((val) => {
              try {
                return JSON.parse(val);
              } catch {
                return undefined;
              }
            })
          ]).optional();
          break;
        case 'CHECKBOX':
          schemaFields[`cell_${column.id}`] = z.boolean().optional();
          break;
        case 'DROPDOWN':
        case 'STATUS':
        case 'RADIO':
        case 'PEOPLE': {
          const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
          if (peopleSettings?.peopleType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string()).optional();
          } else {
            schemaFields[`cell_${column.id}`] = z.string().optional();
          }
          break;
        }
        case 'FILE': {
          const fileSettings = column.settings as { fileType?: 'single' | 'multiple' } | undefined;
          if (fileSettings?.fileType === 'multiple') {
            schemaFields[`cell_${column.id}`] = z.array(z.string()).optional();
          } else {
            schemaFields[`cell_${column.id}`] = z.string().optional();
          }
          break;
        }
        default:
          schemaFields[`cell_${column.id}`] = z.any().optional();
      }
    }
  });

  return z.object(schemaFields);
};

type ItemFormData = {
  name: string;
  status?: string;
  [key: string]: unknown;
};

export const CreateItemDialog: React.FC<CreateItemDialogProps> = ({
  open,
  onOpenChange,
  boardId,
  columns,
  item,
  onSuccess,
}) => {
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);
  
  // Try to get workspaceId from board API
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await boardAPI.getBoardById(boardId);
        if (response.success && response.data) {
          const board = response.data as any;
          if (board.workspaceId) {
            setWorkspaceId(board.workspaceId);
          }
        }
      } catch (error) {
        console.error('Error fetching board:', error);
      }
    };
    if (open && boardId) {
      fetchBoard();
    }
  }, [open, boardId]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceId) return;
      try {
        const response = await workspaceAPI.getWorkspaceMembers(workspaceId);
        if (response.success && response.data) {
          const membersData = Array.isArray(response.data) ? response.data : [];
          const formattedMembers = membersData.map((member: Record<string, unknown>) => ({
            id: String(
              member.userId || 
              (member.user && typeof member.user === 'object' && 'id' in member.user ? member.user.id : '')
            ),
            name: String(
              member.user && typeof member.user === 'object' && 'name' in member.user
                ? member.user.name
                : member.email || 'Unknown'
            ),
            email: String(
              member.user && typeof member.user === 'object' && 'email' in member.user
                ? member.user.email
                : member.email || ''
            ),
            profilePicture: 
              member.user && typeof member.user === 'object' && 'profilePicture' in member.user
                ? String(member.user.profilePicture || '')
                : undefined,
          }));
          setWorkspaceMembers(formattedMembers);
        }
      } catch (error) {
        console.error('Error fetching workspace members:', error);
      }
    };
    if (open && workspaceId) {
      fetchMembers();
    }
  }, [open, workspaceId]);

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!item;

  // Filter visible columns and sort by position (memoized)
  const visibleColumns = useMemo(() => (
    columns
      .filter(col => !col.isHidden)
      .sort((a, b) => a.position - b.position)
  ), [columns]);

  const schema = createItemSchema(columns);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name || '',
      status: item?.status || '',
    },
  });

  // Initialize form with item data when editing
  useEffect(() => {
    if (!open) return; // only initialize when dialog is open
    if (item) {
      const defaultValues: Record<string, unknown> = {
        name: item.name,
        status: item.status || '',
      };

          // Load cell values
      visibleColumns.forEach((column) => {
        const cell = item.cells?.[column.id];
        if (cell) {
          const cellValue = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
          
          if (column.type === 'DATE' || column.type === 'DATETIME') {
            if (cellValue) {
              const dateValue = new Date(cellValue as string);
              // Format for HTML5 date/datetime-local inputs
              if (column.type === 'DATE') {
                defaultValues[`cell_${column.id}`] = dateValue.toISOString().split('T')[0];
              } else {
                // DATETIME: format as YYYY-MM-DDTHH:MM
                const datetimeStr = dateValue.toISOString().slice(0, 16);
                defaultValues[`cell_${column.id}`] = datetimeStr;
              }
            }
          } else if (column.type === 'CHECKBOX') {
            defaultValues[`cell_${column.id}`] = Boolean(cellValue);
          } else if (column.type === 'NUMBER' || column.type === 'CURRENCY') {
            defaultValues[`cell_${column.id}`] = cellValue ? Number(cellValue) : undefined;
          } else {
            defaultValues[`cell_${column.id}`] = cellValue;
          }
        }
      });

      reset(defaultValues);
    } else {
      reset({
        name: '',
        status: '',
      });
    }
  }, [open, item, columns, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Build cells object from form data
      const cells: Record<string, unknown> = {};
      
      visibleColumns.forEach((column) => {
        const fieldName = `cell_${column.id}`;
        const value = data[fieldName];
        
        if (value !== undefined && value !== null && value !== '') {
          // Handle date conversion
          if (column.type === 'DATE') {
            if (typeof value === 'string') {
              const dateValue = new Date(value);
              cells[column.id] = dateValue.toISOString();
            } else if (value instanceof Date) {
              cells[column.id] = value.toISOString();
            } else {
              cells[column.id] = value;
            }
          } else if (column.type === 'DATETIME') {
            if (typeof value === 'string') {
              const dateValue = new Date(value);
              cells[column.id] = dateValue.toISOString();
            } else if (value instanceof Date) {
              cells[column.id] = value.toISOString();
            } else {
              cells[column.id] = value;
            }
          } else if (column.type === 'WEEK') {
            if (typeof value === 'string') {
              // Parse week string (YYYY-WNN) to date
              const match = value.match(/^(\d{4})-W(\d{2})$/);
              if (match) {
                const year = parseInt(match[1], 10);
                const week = parseInt(match[2], 10);
                const simple = new Date(year, 0, 1 + (week - 1) * 7);
                const dow = simple.getDay();
                const ISOweekStart = simple;
                if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
                else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
                cells[column.id] = ISOweekStart.toISOString();
              }
            } else {
              cells[column.id] = value;
            }
          } else if (column.type === 'MONTH') {
            if (typeof value === 'string') {
              const [year, month] = value.split('-').map(Number);
              const dateValue = new Date(year, month - 1, 1);
              cells[column.id] = dateValue.toISOString();
            } else {
              cells[column.id] = value;
            }
          } else if (column.type === 'YEAR') {
            if (typeof value === 'string') {
              const year = parseInt(value, 10);
              const dateValue = new Date(year, 0, 1);
              cells[column.id] = dateValue.toISOString();
            } else {
              cells[column.id] = value;
            }
          } else if (column.type === 'TIMELINE') {
            const startValue = data[`${fieldName}_start`];
            const endValue = data[`${fieldName}_end`];
            if (startValue && endValue && typeof startValue === 'string' && typeof endValue === 'string') {
              cells[column.id] = {
                start: new Date(startValue).toISOString(),
                end: new Date(endValue).toISOString(),
              };
            } else if (typeof value === 'object' && value !== null && 'start' in value && 'end' in value) {
              cells[column.id] = {
                start: new Date(value.start as string).toISOString(),
                end: new Date(value.end as string).toISOString(),
              };
            }
          } else if (column.type === 'NUMBER' || column.type === 'CURRENCY' || column.type === 'PERCENTAGE' || column.type === 'RATING') {
            // Convert string numbers to actual numbers
            if (typeof value === 'string' && value.trim() !== '') {
              const numValue = Number(value);
              cells[column.id] = isNaN(numValue) ? value : numValue;
            } else {
              cells[column.id] = value;
            }
          } else if (column.type === 'AUTO_NUMBER') {
            // Skip AUTO_NUMBER - will be generated by backend
          } else if (column.type === 'PEOPLE' || column.type === 'FILE') {
            // PEOPLE and FILE are already stored correctly (string or array of IDs)
            cells[column.id] = value;
          } else {
            cells[column.id] = value;
          }
        } else if (column.defaultValue !== undefined && column.defaultValue !== null) {
          // Use default value if field is empty
          cells[column.id] = column.defaultValue;
        }
      });

      const itemData: CreateItemInput = {
        name: data.name,
        status: data.status && data.status.trim() !== '' ? data.status : undefined,
        cells: Object.keys(cells).length > 0 ? cells : undefined,
      };

      let response;
      if (isEditMode && item) {
        response = await boardAPI.updateItem(item.id, itemData);
      } else {
        response = await boardAPI.createItem(boardId, itemData);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: isEditMode ? 'Item updated successfully' : 'Item created successfully',
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} item`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} item:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} item`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (column: Column) => {
    const fieldName = `cell_${column.id}`;
    const error = errors[fieldName];
    const isRequired = column.required;

    switch (column.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'LINK':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type={column.type === 'EMAIL' ? 'email' : column.type === 'PHONE' ? 'tel' : column.type === 'LINK' ? 'url' : 'text'}
              {...register(fieldName)}
              placeholder={column.type === 'EMAIL' ? 'email@example.com' : column.type === 'PHONE' ? '+1 (555) 123-4567' : column.type === 'LINK' ? 'https://example.com' : `Enter ${column.name.toLowerCase()}`}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );

      case 'LONG_TEXT':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              {...register(fieldName)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              rows={4}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );

      case 'NUMBER':
        const numberSettings = column.settings as { numberType?: 'integer' | 'decimal' } | undefined;
        const isInteger = numberSettings?.numberType === 'integer';
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              step={isInteger ? '1' : '0.01'}
              {...register(fieldName)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );

      case 'CURRENCY':
        const currencySettings = column.settings as { currency?: string } | undefined;
        const currency = currencySettings?.currency || 'USD';
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name} ({currency})
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              step="0.01"
              {...register(fieldName)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );

      case 'PERCENTAGE':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={fieldName}
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register(fieldName)}
                placeholder="0-100"
                className={error ? 'border-destructive pr-8' : 'pr-8'}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );

      case 'RATING':
        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              render={({ field }) => {
                const rating = field.value ? Math.min(5, Math.max(0, Number(field.value))) : 0;
                return (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'h-8 w-8 cursor-pointer transition-colors',
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        )}
                        onClick={() => field.onChange(star)}
                      />
                    ))}
                    {rating > 0 && <span className="text-sm text-muted-foreground ml-2">({rating}/5)</span>}
                  </div>
                );
              }}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );

      case 'AUTO_NUMBER':
        // Auto-number is read-only, show current value or placeholder
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              <span className="text-xs text-muted-foreground ml-2">(Auto-generated)</span>
            </Label>
            <Input
              id={fieldName}
              type="text"
              value={item?.cells?.[column.id] ? String(item.cells[column.id]) : 'Auto-generated'}
              disabled
              className="bg-muted"
            />
          </div>
        );

      case 'DATE':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="date"
              {...register(fieldName)}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
      case 'DATETIME':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="datetime-local"
              {...register(fieldName)}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
      case 'WEEK':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="week"
              {...register(fieldName)}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
      case 'MONTH':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="month"
              {...register(fieldName)}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
      case 'YEAR':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              min="1900"
              max="2100"
              placeholder="YYYY"
              {...register(fieldName)}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
      case 'TIMELINE':
        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor={`${fieldName}_start`} className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id={`${fieldName}_start`}
                  type="date"
                  {...register(`${fieldName}_start`)}
                  className={error ? 'border-destructive' : ''}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`${fieldName}_end`} className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id={`${fieldName}_end`}
                  type="date"
                  {...register(`${fieldName}_end`)}
                  className={error ? 'border-destructive' : ''}
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );

      case 'CHECKBOX':
        return (
          <Controller
            key={column.id}
            name={fieldName}
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={fieldName}
                  checked={field.value as boolean || false}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor={fieldName} className="font-normal cursor-pointer">
                  {column.name}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                {error && (
                  <p className="text-sm text-destructive ml-2">{error.message as string}</p>
                )}
              </div>
            )}
          />
        );

      case 'DROPDOWN':
      case 'STATUS':
        return (
          <Controller
            key={column.id}
            name={fieldName}
            control={control}
            render={({ field }) => {
              // Get options from column settings
              const options = (column.settings as { options?: string[] })?.options || [];
              
              return (
                <div className="space-y-2">
                  <Label>
                    {column.name}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Select onValueChange={field.onChange} value={field.value as string || ''}>
                    <SelectTrigger className={error ? 'border-destructive' : ''}>
                      <SelectValue placeholder={`Select ${column.name.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.length > 0 ? (
                        options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={field.value as string || ''}>
                          {field.value as string || 'No options available'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {error && (
                    <p className="text-sm text-destructive">{error.message as string}</p>
                  )}
                </div>
              );
            }}
          />
        );

      case 'RADIO':
        return (
          <Controller
            key={column.id}
            name={fieldName}
            control={control}
            render={({ field }) => {
              // Get options from column settings
              const options = (column.settings as { options?: string[] })?.options || [];
              
              return (
                <div className="space-y-2">
                  <Label>
                    {column.name}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value as string || ''}
                    className="space-y-2"
                  >
                    {options.length > 0 ? (
                      options.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`radio-${column.id}-${option}`} />
                          <Label htmlFor={`radio-${column.id}-${option}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No options available</p>
                    )}
                  </RadioGroup>
                  {error && (
                    <p className="text-sm text-destructive">{error.message as string}</p>
                  )}
                </div>
              );
            }}
          />
        );

      case 'PEOPLE': {
        const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
        const isMultiple = peopleSettings?.peopleType === 'multiple';
        return (
          <Controller
            key={column.id}
            name={fieldName}
            control={control}
            render={({ field }) => {
              const currentValue = field.value;
              const userIds = Array.isArray(currentValue) 
                ? currentValue.map(id => String(id))
                : currentValue 
                ? [String(currentValue)]
                : [];

              return (
                <div className="space-y-2">
                  <Label>
                    {column.name}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {isMultiple ? (
                    <div className="space-y-2">
                      <Select
                        value=""
                        onValueChange={(val) => {
                          const newValues = userIds.includes(val)
                            ? userIds.filter(id => id !== val)
                            : [...userIds, val];
                          field.onChange(newValues);
                        }}
                      >
                        <SelectTrigger className={error ? 'border-destructive' : ''}>
                          <SelectValue placeholder={`${userIds.length} selected`} />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaceMembers.map((member) => {
                            const isSelected = userIds.includes(member.id);
                            return (
                              <SelectItem key={member.id} value={member.id} className={isSelected ? 'bg-blue-50' : ''}>
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={isSelected} />
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
                      {userIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workspaceMembers.filter(m => userIds.includes(m.id)).map((user) => (
                            <div key={user.id} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={user.profilePicture} />
                                <AvatarFallback className="text-xs">
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{user.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as string || ''}
                    >
                      <SelectTrigger className={error ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaceMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
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
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {error && (
                    <p className="text-sm text-destructive">{error.message as string}</p>
                  )}
                </div>
              );
            }}
          />
        );
      }

      case 'FILE': {
        const fileSettings = column.settings as { fileType?: 'single' | 'multiple'; allowedFileTypes?: string[]; maxFileSize?: number } | undefined;
        const isMultiple = fileSettings?.fileType === 'multiple';
        const allowedFileTypes = fileSettings?.allowedFileTypes || [];
        const maxFileSize = fileSettings?.maxFileSize || 5;
        const fieldName = `cell_${column.id}` as keyof FormData;
        const error = errors[fieldName];

        return (
          <Controller
            key={column.id}
            name={fieldName}
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label>
                  {column.name}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
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
                {error && (
                  <p className="text-sm text-destructive">{error.message as string}</p>
                )}
              </div>
            )}
          />
        );
      }

      default:
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={fieldName}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              {...register(fieldName)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error.message as string}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Item' : 'Create New Item'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the item details below.' : 'Fill in the details to create a new item.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Item Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter item name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              {...register('status')}
              placeholder="Enter status (optional)"
            />
          </div>

          {visibleColumns.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">Column Values</h3>
              {visibleColumns.map((column) => renderField(column))}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

