import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import { boardAPI } from '@/lib/api';
import { Column, ColumnType, CreateColumnInput, UpdateColumnInput, Board } from '@/types/workspace';

interface CreateColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  column?: Column | null;
  existingColumns?: Column[];
  onSuccess?: () => void;
}

const COLUMN_TYPES: { value: ColumnType; label: string; description: string }[] = [
  { value: 'TEXT', label: 'Text', description: 'Single-line text field' },
  { value: 'LONG_TEXT', label: 'Long Text', description: 'Multi-line text field' },
  { value: 'EMAIL', label: 'Email', description: 'Email address field' },
  { value: 'PHONE', label: 'Phone', description: 'Phone number field' },
  { value: 'NUMBER', label: 'Number', description: 'Numeric value (integer or decimal)' },
  { value: 'CURRENCY', label: 'Currency', description: 'Money amount with currency selector' },
  { value: 'PERCENTAGE', label: 'Percentage', description: 'Percentage value (0-100)' },
  { value: 'DATE', label: 'Date', description: 'Date picker' },
  { value: 'DATETIME', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'WEEK', label: 'Week', description: 'Week picker' },
  { value: 'MONTH', label: 'Month', description: 'Month picker' },
  { value: 'YEAR', label: 'Year', description: 'Year picker' },
  { value: 'CHECKBOX', label: 'Checkbox', description: 'Yes/No toggle' },
  { value: 'DROPDOWN', label: 'Dropdown', description: 'Single selection from options' },
  { value: 'MULTI_SELECT', label: 'Multi-Select', description: 'Multiple selections (tags)' },
  { value: 'RADIO', label: 'Radio Buttons', description: 'Single choice from radio buttons' },
  { value: 'STATUS', label: 'Status', description: 'Color-coded status' },
  { value: 'PEOPLE', label: 'People', description: 'Assign to users' },
  { value: 'FILE', label: 'File', description: 'File upload' },
  { value: 'LINK', label: 'Link', description: 'URL link' },
  { value: 'AUTO_NUMBER', label: 'Auto-Number', description: 'Auto-incrementing number' },
  { value: 'RATING', label: 'Rating', description: 'Star rating (1-5)' },
  { value: 'VOTE', label: 'Vote', description: 'Thumbs up/down' },
  { value: 'TIMELINE', label: 'Timeline', description: 'Date range' },
  { value: 'FORMULA', label: 'Formula', description: 'Calculated value' },
  { value: 'PROGRESS', label: 'Progress Bar', description: 'Visual progress indicator (0-100%)' },
  { value: 'LOCATION', label: 'Location', description: 'Map picker for location' },
  { value: 'MIRROR', label: 'Mirror Column', description: 'Mirror data from linked board' },
];

export const CreateColumnDialog: React.FC<CreateColumnDialogProps> = ({
  open,
  onOpenChange,
  boardId,
  column,
  existingColumns = [],
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [availableBoards, setAvailableBoards] = useState<Board[]>([]);
  const [linkedBoardColumns, setLinkedBoardColumns] = useState<Column[]>([]);
  const isEditMode = !!column;

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'SGD', 'AED', 'CHF', 'NZD', 'BRL', 'MXN', 'ZAR'];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<{
    name: string;
    type: ColumnType;
    required: boolean;
    isHidden: boolean;
    unique?: boolean;
    width?: number;
    defaultValue?: string;
    options?: string; // For DROPDOWN, MULTI_SELECT, STATUS
    description?: string;
    currency?: string; // For CURRENCY type
    numberType?: 'integer' | 'decimal'; // For NUMBER type
    peopleType?: 'single' | 'multiple'; // For PEOPLE type
    fileType?: 'single' | 'multiple'; // For FILE type
    allowedFileTypes?: string; // Comma-separated MIME types or extensions
    maxFileSize?: number; // In MB
    formula?: string; // For FORMULA type
    linkedBoardId?: string; // For MIRROR type
    linkedColumnId?: string; // For MIRROR type
    linkedItemId?: string; // For MIRROR type
  }>({
    defaultValues: {
      name: column?.name || '',
      type: column?.type || 'TEXT',
      required: column?.required || false,
      isHidden: column?.isHidden || false,
      width: column?.width || 200,
      defaultValue: column?.defaultValue ? String(column.defaultValue) : '',
      options: column?.settings && 'options' in column.settings 
        ? (column.settings.options as string[]).join(', ') 
        : '',
      unique: column?.settings && 'unique' in (column.settings as Record<string, unknown>) 
        ? (column.settings as Record<string, unknown>).unique === true 
        : false,
      currency: (column?.settings && 'currency' in column.settings ? (column.settings as Record<string, unknown>).currency : 'USD') as string || 'USD',
      numberType: (column?.settings && 'numberType' in column.settings ? (column.settings as Record<string, unknown>).numberType : 'decimal') as 'integer' | 'decimal' || 'decimal',
      peopleType: (column?.settings && 'peopleType' in column.settings ? (column.settings as Record<string, unknown>).peopleType : 'single') as 'single' | 'multiple' || 'single',
      fileType: (column?.settings && 'fileType' in column.settings ? (column.settings as Record<string, unknown>).fileType : 'single') as 'single' | 'multiple' || 'single',
      allowedFileTypes: column?.settings && 'allowedFileTypes' in column.settings 
        ? Array.isArray(column.settings.allowedFileTypes) 
          ? (column.settings.allowedFileTypes as string[]).join(', ')
          : String(column.settings.allowedFileTypes)
        : '',
      maxFileSize: column?.settings && 'maxFileSize' in column.settings 
        ? Number(column.settings.maxFileSize) || 5
        : 5,
      formula: column?.settings && 'formula' in column.settings 
        ? String(column.settings.formula || '')
        : '',
      linkedBoardId: column?.settings && 'linkedBoardId' in column.settings 
        ? String(column.settings.linkedBoardId || '')
        : '',
      linkedColumnId: column?.settings && 'linkedColumnId' in column.settings 
        ? String(column.settings.linkedColumnId || '')
        : '',
      linkedItemId: column?.settings && 'linkedItemId' in column.settings 
        ? String(column.settings.linkedItemId || '')
        : '',
    },
  });

  const selectedType = watch('type');
  const selectedLinkedBoardId = watch('linkedBoardId');

  // Fetch workspaceId and available boards
  useEffect(() => {
    const fetchBoardInfo = async () => {
      try {
        const response = await boardAPI.getBoardById(boardId);
        if (response.success && response.data) {
          const board = response.data as Board;
          setWorkspaceId(board.workspaceId);
          
          // Fetch all boards in workspace for MIRROR type
          if (board.workspaceId) {
            const boardsResponse = await boardAPI.getWorkspaceBoards(board.workspaceId, {
              page: 1,
              limit: 100,
            });
            if (boardsResponse.success && boardsResponse.data) {
              const boardsData = (boardsResponse.data as any).data || (boardsResponse.data as any).boards || [];
              // Filter out current board
              const otherBoards = boardsData.filter((b: Board) => b.id !== boardId);
              setAvailableBoards(otherBoards);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching board info:', error);
      }
    };
    
    if (open && boardId) {
      fetchBoardInfo();
    }
  }, [open, boardId]);

  // Fetch columns from linked board when board is selected
  useEffect(() => {
    const fetchLinkedBoardColumns = async () => {
      if (!selectedLinkedBoardId) {
        setLinkedBoardColumns([]);
        return;
      }
      try {
        const response = await boardAPI.getBoardColumns(selectedLinkedBoardId);
        if (response.success && response.data) {
          const columns = (response.data as Column[]) || [];
          setLinkedBoardColumns(columns);
        }
      } catch (error) {
        console.error('Error fetching linked board columns:', error);
        setLinkedBoardColumns([]);
      }
    };
    
    if (selectedLinkedBoardId) {
      fetchLinkedBoardColumns();
    }
  }, [selectedLinkedBoardId]);

  useEffect(() => {
    if (column) {
      reset({
        name: column.name,
        type: column.type,
        required: column.required,
        isHidden: column.isHidden,
        width: column.width || 200,
        defaultValue: column.defaultValue ? String(column.defaultValue) : '',
        options: column.settings && 'options' in column.settings 
          ? (column.settings.options as string[]).join(', ') 
          : '',
        currency: column.settings && 'currency' in column.settings 
          ? (column.settings as Record<string, unknown>).currency as string 
          : 'USD',
        numberType: column.settings && 'numberType' in column.settings 
          ? (column.settings as Record<string, unknown>).numberType as 'integer' | 'decimal'
          : 'decimal',
      });
    } else {
      reset({
        name: '',
        type: 'TEXT',
        required: false,
        isHidden: false,
        width: 200,
        defaultValue: '',
        options: '',
        unique: column?.settings && 'unique' in (column.settings as Record<string, unknown>) 
          ? (column.settings as Record<string, unknown>).unique === true 
          : false,
      });
    }
  }, [column, reset]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      // Calculate position (last position + 1 for new columns)
      const maxPosition = existingColumns.length > 0
        ? Math.max(...existingColumns.map(c => c.position))
        : -1;

      const settings: Record<string, unknown> = {};
      
      // Parse options for dropdown/multi-select/status
      if (['DROPDOWN', 'MULTI_SELECT', 'STATUS'].includes(selectedType) && data.options) {
        settings.options = data.options.split(',').map((opt: string) => opt.trim()).filter(Boolean);
      }

      // Add currency for CURRENCY type
      if (selectedType === 'CURRENCY' && data.currency) {
        settings.currency = data.currency;
      }

      // Add numberType for NUMBER type (integer vs decimal)
      if (selectedType === 'NUMBER' && data.numberType) {
        settings.numberType = data.numberType;
      }

      // Add peopleType for PEOPLE type (single vs multiple)
      if (selectedType === 'PEOPLE' && data.peopleType) {
        settings.peopleType = data.peopleType;
      }

      // Add fileType for FILE type (single vs multiple)
      if (selectedType === 'FILE' && data.fileType) {
        settings.fileType = data.fileType;
      }

      // Add allowedFileTypes for FILE type
      if (selectedType === 'FILE' && data.allowedFileTypes) {
        settings.allowedFileTypes = data.allowedFileTypes.split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      // Add maxFileSize for FILE type (in MB)
      if (selectedType === 'FILE' && data.maxFileSize) {
        settings.maxFileSize = Number(data.maxFileSize);
      }

      // Add formula for FORMULA type
      if (selectedType === 'FORMULA' && data.formula) {
        settings.formula = data.formula.trim();
      }

      // Add board linking for MIRROR type
      if (selectedType === 'MIRROR') {
        if (data.linkedBoardId) {
          settings.linkedBoardId = data.linkedBoardId;
        }
        if (data.linkedColumnId) {
          settings.linkedColumnId = data.linkedColumnId;
        }
        if (data.linkedItemId) {
          settings.linkedItemId = data.linkedItemId;
        }
      }

      // Add unique constraint to settings
      if (data.unique) {
        settings.unique = true;
      }

      const columnData: CreateColumnInput | UpdateColumnInput = {
        name: data.name.trim(),
        type: data.type,
        required: data.required,
        isHidden: data.isHidden,
        width: data.width ? parseInt(String(data.width)) : undefined,
        settings: Object.keys(settings).length > 0 ? settings : undefined,
        defaultValue: data.defaultValue 
          ? (selectedType === 'NUMBER' || selectedType === 'CURRENCY' || selectedType === 'PERCENTAGE'
              ? parseFloat(data.defaultValue) 
              : selectedType === 'CHECKBOX'
              ? data.defaultValue === 'true'
              : data.defaultValue)
          : undefined,
      };

      if (isEditMode) {
        const response = await boardAPI.updateColumn(column.id, columnData as UpdateColumnInput);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Column updated successfully',
          });
          onSuccess?.();
          onOpenChange(false);
        } else {
          throw new Error(response.message || 'Failed to update column');
        }
      } else {
        const createData: any = {
          name: columnData.name!,
          type: columnData.type!,
          position: maxPosition + 1,
        };
        if (columnData.width) createData.width = columnData.width;
        if (columnData.required !== undefined) createData.required = columnData.required;
        if (columnData.settings) createData.settings = columnData.settings;
        
        const response = await boardAPI.createColumn(boardId, createData);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Column created successfully',
          });
          onSuccess?.();
          onOpenChange(false);
        } else {
          throw new Error(response.message || 'Failed to create column');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save column',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const needsOptions = ['DROPDOWN', 'MULTI_SELECT', 'STATUS'].includes(selectedType);
  const needsDefaultValue = !['FORMULA', 'AUTO_NUMBER'].includes(selectedType);
  const needsCurrency = selectedType === 'CURRENCY';
  const needsNumberType = selectedType === 'NUMBER';
  const needsPeopleType = selectedType === 'PEOPLE';
  const needsFileSettings = selectedType === 'FILE';
  const needsFormula = selectedType === 'FORMULA';
  const needsMirrorSettings = selectedType === 'MIRROR';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Column' : 'Create New Column'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update column properties and settings'
              : 'Add a new column to this board. Columns define the data structure for items.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Column Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Column name is required', minLength: 1, maxLength: 100 })}
              placeholder="Enter column name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Column Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('type', value as ColumnType)}
              disabled={isEditMode}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Column type cannot be changed after creation
              </p>
            )}
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label htmlFor="options">
                Options <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (comma-separated values)
                </span>
              </Label>
              <Textarea
                id="options"
                {...register('options', { required: needsOptions ? 'Options are required' : false })}
                placeholder="Option 1, Option 2, Option 3"
                rows={3}
                className={errors.options ? 'border-destructive' : ''}
              />
              {errors.options && (
                <p className="text-sm text-destructive">{errors.options.message}</p>
              )}
            </div>
          )}

          {needsCurrency && (
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
          )}

          {needsNumberType && (
            <div className="space-y-2">
              <Label htmlFor="numberType">
                Number Type
              </Label>
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
          )}

          {needsPeopleType && (
            <div className="space-y-2">
              <Label htmlFor="peopleType">
                People Type
              </Label>
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
          )}

          {needsFileSettings && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fileType">
                  File Type
                </Label>
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
                <Label htmlFor="maxFileSize">
                  Maximum File Size (MB)
                </Label>
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
          )}

          {needsFormula && (
            <div className="space-y-2">
              <Label htmlFor="formula">
                Formula
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="formula"
                {...register('formula', { required: needsFormula ? 'Formula is required' : false })}
                placeholder="Enter formula (e.g., {Column1} + {Column2} * 0.1)"
                rows={4}
                className={errors.formula ? 'border-destructive' : 'font-mono text-sm'}
              />
              <p className="text-xs text-muted-foreground">
                Use {'{ColumnName}'} to reference other columns. Supports: +, -, *, /, SUM(), AVG(), COUNT(), MAX(), MIN()
              </p>
              {errors.formula && (
                <p className="text-sm text-destructive">{errors.formula.message as string}</p>
              )}
            </div>
          )}

          {needsMirrorSettings && (
            <>
              <div className="space-y-2">
                <Label htmlFor="linkedBoardId">
                  Linked Board
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={watch('linkedBoardId') || ''}
                  onValueChange={(value) => {
                    setValue('linkedBoardId', value);
                    setValue('linkedColumnId', ''); // Reset column when board changes
                    setValue('linkedItemId', ''); // Reset item when board changes
                  }}
                >
                  <SelectTrigger className={errors.linkedBoardId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select board to mirror from" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBoards.length > 0 ? (
                      availableBoards.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No other boards available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.linkedBoardId && (
                  <p className="text-sm text-destructive">{errors.linkedBoardId.message as string}</p>
                )}
              </div>

              {selectedLinkedBoardId && (
                <div className="space-y-2">
                  <Label htmlFor="linkedColumnId">
                    Column to Mirror
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={watch('linkedColumnId') || ''}
                    onValueChange={(value) => setValue('linkedColumnId', value)}
                  >
                    <SelectTrigger className={errors.linkedColumnId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select column to mirror" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkedBoardColumns.length > 0 ? (
                        linkedBoardColumns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.name} ({col.type})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>Loading columns...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.linkedColumnId && (
                    <p className="text-sm text-destructive">{errors.linkedColumnId.message as string}</p>
                  )}
                </div>
              )}

              {selectedLinkedBoardId && (
                <div className="space-y-2">
                  <Label htmlFor="linkedItemId">
                    Link to Specific Item (Optional)
                  </Label>
                  <Input
                    id="linkedItemId"
                    {...register('linkedItemId')}
                    placeholder="Item ID (leave empty to link dynamically)"
                    className={errors.linkedItemId ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    If specified, this column will always show the value from that specific item. Leave empty to link items dynamically.
                  </p>
                </div>
              )}
            </>
          )}

          {needsDefaultValue && (
            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                {...register('defaultValue')}
                placeholder={
                  selectedType === 'NUMBER' || selectedType === 'CURRENCY' || selectedType === 'PERCENTAGE'
                    ? '0'
                    : selectedType === 'CHECKBOX'
                    ? 'true or false'
                    : selectedType === 'DATE'
                    ? 'YYYY-MM-DD'
                    : selectedType === 'DATETIME'
                    ? 'YYYY-MM-DDTHH:MM'
                    : 'Enter default value'
                }
                type={
                  selectedType === 'DATE'
                    ? 'date'
                    : selectedType === 'DATETIME'
                    ? 'datetime-local'
                    : selectedType === 'NUMBER' || selectedType === 'CURRENCY' || selectedType === 'PERCENTAGE'
                    ? 'number'
                    : 'text'
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="width">Column Width (px)</Label>
            <Input
              id="width"
              type="number"
              min="50"
              max="1000"
              {...register('width', { 
                valueAsNumber: true, 
                min: 50, 
                max: 1000 
              })}
              placeholder="200"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={watch('required')}
              onCheckedChange={(checked) => setValue('required', checked as boolean)}
            />
            <Label htmlFor="required" className="cursor-pointer">
              Required field
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isHidden"
              checked={watch('isHidden')}
              onCheckedChange={(checked) => setValue('isHidden', checked as boolean)}
            />
            <Label htmlFor="isHidden" className="cursor-pointer">
              Hide column (will not be visible in views)
            </Label>
          </div>

          {selectedType !== 'CHECKBOX' && selectedType !== 'FILE' && selectedType !== 'FORMULA' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unique"
                checked={watch('unique')}
                onCheckedChange={(checked) => setValue('unique', checked as boolean)}
              />
              <Label htmlFor="unique" className="cursor-pointer">
                Unique values only (no duplicates allowed)
              </Label>
            </div>
          )}

          {isEditMode && column && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
              <p className="font-medium text-yellow-800 mb-1">⚠️ Column Type Change Warning</p>
              <p className="text-yellow-700">
                Changing column type may result in data loss or conversion errors. Existing data will be migrated when possible.
              </p>
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
              {loading ? 'Saving...' : isEditMode ? 'Update Column' : 'Create Column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

