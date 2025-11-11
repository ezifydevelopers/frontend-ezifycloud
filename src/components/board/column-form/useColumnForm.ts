// Custom hook for column form state management

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Column, ColumnType, Board, CreateColumnInput, UpdateColumnInput } from '@/types/workspace';
import { boardAPI } from '@/lib/api';

interface UseColumnFormProps {
  boardId: string;
  column?: Column | null;
  existingColumns: Column[];
  open: boolean;
}

export const useColumnForm = ({ boardId, column, existingColumns, open }: UseColumnFormProps) => {
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [availableBoards, setAvailableBoards] = useState<Board[]>([]);
  const [linkedBoardColumns, setLinkedBoardColumns] = useState<Column[]>([]);
  const originalType = column?.type;

  const form = useForm({
    defaultValues: {
      name: column?.name || '',
      description: (column?.settings && 'description' in column.settings
        ? String(column.settings.description || '')
        : '') || '',
      type: (column?.type || 'TEXT') as ColumnType,
      position: column?.position ?? existingColumns.length > 0 
        ? Math.max(...existingColumns.map(c => c.position)) + 1 
        : 0,
      required: column?.required || false,
      isHidden: column?.isHidden || false,
      width: column?.width || 200,
      defaultValue: column?.defaultValue !== undefined && column.defaultValue !== null
        ? (Array.isArray(column.defaultValue)
            ? column.defaultValue
            : typeof column.defaultValue === 'object'
            ? JSON.stringify(column.defaultValue)
            : String(column.defaultValue))
        : '',
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
      // Pin settings
      pinSide: (column?.settings && 'pinSide' in column.settings 
        ? (column.settings.pinSide as 'left' | 'right' | null)
        : null) || null,
      // Validation rules
      validationMinLength: column?.settings && 'validationMinLength' in column.settings
        ? Number(column.settings.validationMinLength) || undefined
        : undefined,
      validationMaxLength: column?.settings && 'validationMaxLength' in column.settings
        ? Number(column.settings.validationMaxLength) || undefined
        : undefined,
      validationMinValue: column?.settings && 'validationMinValue' in column.settings
        ? Number(column.settings.validationMinValue) || undefined
        : undefined,
      validationMaxValue: column?.settings && 'validationMaxValue' in column.settings
        ? Number(column.settings.validationMaxValue) || undefined
        : undefined,
      validationPattern: column?.settings && 'validationPattern' in column.settings
        ? String(column.settings.validationPattern || '')
        : '',
      validationCustomMessage: column?.settings && 'validationCustomMessage' in column.settings
        ? String(column.settings.validationCustomMessage || '')
        : '',
    },
  });

  const { watch, reset } = form;
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
          
          if (board.workspaceId) {
            const boardsResponse = await boardAPI.getWorkspaceBoards(board.workspaceId, {
              page: 1,
              limit: 100,
            });
            if (boardsResponse.success && boardsResponse.data) {
              const boardsData = (boardsResponse.data as any).data || (boardsResponse.data as any).boards || [];
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

  // Fetch columns from linked board
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

  // Reset form when column changes
  useEffect(() => {
    if (column) {
      reset({
        name: column.name,
        description: (column.settings && 'description' in column.settings
          ? String(column.settings.description || '')
          : '') || '',
        type: column.type,
        position: column.position,
        required: column.required,
        isHidden: column.isHidden,
        width: column.width || 200,
        defaultValue: column.defaultValue !== undefined && column.defaultValue !== null
          ? (Array.isArray(column.defaultValue)
              ? column.defaultValue
              : typeof column.defaultValue === 'object'
              ? JSON.stringify(column.defaultValue)
              : String(column.defaultValue))
          : '',
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
        description: '',
        type: 'TEXT',
        position: existingColumns.length > 0 
          ? Math.max(...existingColumns.map(c => c.position)) + 1 
          : 0,
        required: false,
        isHidden: false,
        width: 200,
        defaultValue: '',
        options: '',
        unique: false,
      });
    }
  }, [column, reset]);

  // Convert form data to column API format
  const convertFormDataToColumn = useCallback((data: any, selectedType: ColumnType): CreateColumnInput | UpdateColumnInput => {
    const settings: Record<string, unknown> = {};
    
    // Add description to settings
    if (data.description && data.description.trim()) {
      settings.description = data.description.trim();
    }
    
    // Parse options for dropdown/multi-select/status
    if (['DROPDOWN', 'MULTI_SELECT', 'STATUS'].includes(selectedType) && data.options) {
      settings.options = data.options.split(',').map((opt: string) => opt.trim()).filter(Boolean);
    }

    // Add currency for CURRENCY type
    if (selectedType === 'CURRENCY' && data.currency) {
      settings.currency = data.currency;
    }

    // Add numberType for NUMBER type
    if (selectedType === 'NUMBER' && data.numberType) {
      settings.numberType = data.numberType;
    }

    // Add peopleType for PEOPLE type
    if (selectedType === 'PEOPLE' && data.peopleType) {
      settings.peopleType = data.peopleType;
    }

    // Add fileType for FILE type
    if (selectedType === 'FILE' && data.fileType) {
      settings.fileType = data.fileType;
    }

    // Add allowedFileTypes for FILE type
    if (selectedType === 'FILE' && data.allowedFileTypes) {
      settings.allowedFileTypes = data.allowedFileTypes.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    // Add maxFileSize for FILE type
    if (selectedType === 'FILE' && data.maxFileSize) {
      settings.maxFileSize = Number(data.maxFileSize);
    }

    // Add formula for FORMULA type
    if (selectedType === 'FORMULA' && data.formula) {
      settings.formula = data.formula.trim();
    }

    // Add board linking for MIRROR type
    if (selectedType === 'MIRROR') {
      if (data.linkedBoardId) settings.linkedBoardId = data.linkedBoardId;
      if (data.linkedColumnId) settings.linkedColumnId = data.linkedColumnId;
      if (data.linkedItemId) settings.linkedItemId = data.linkedItemId;
    }

    // Add unique constraint
    if (data.unique) {
      settings.unique = true;
    }

    // Add pin side
    if (data.pinSide !== undefined && data.pinSide !== null) {
      settings.pinSide = data.pinSide;
    }

    // Add validation rules
    if (data.validationMinLength !== undefined && data.validationMinLength !== null) {
      settings.validationMinLength = Number(data.validationMinLength);
    }
    if (data.validationMaxLength !== undefined && data.validationMaxLength !== null) {
      settings.validationMaxLength = Number(data.validationMaxLength);
    }
    if (data.validationMinValue !== undefined && data.validationMinValue !== null) {
      settings.validationMinValue = Number(data.validationMinValue);
    }
    if (data.validationMaxValue !== undefined && data.validationMaxValue !== null) {
      settings.validationMaxValue = Number(data.validationMaxValue);
    }
    if (data.validationPattern && data.validationPattern.trim()) {
      settings.validationPattern = data.validationPattern.trim();
    }
    if (data.validationCustomMessage && data.validationCustomMessage.trim()) {
      settings.validationCustomMessage = data.validationCustomMessage.trim();
    }

    return {
      name: data.name.trim(),
      type: data.type,
      position: data.position !== undefined ? parseInt(String(data.position)) : undefined,
      required: data.required,
      isHidden: data.isHidden,
      width: data.width ? parseInt(String(data.width)) : undefined,
      settings: Object.keys(settings).length > 0 ? settings : undefined,
      defaultValue: (() => {
        if (!data.defaultValue || (Array.isArray(data.defaultValue) && data.defaultValue.length === 0)) {
          return undefined;
        }
        
        // Handle different types
        if (selectedType === 'NUMBER' || selectedType === 'CURRENCY' || selectedType === 'PERCENTAGE') {
          return typeof data.defaultValue === 'number' ? data.defaultValue : parseFloat(String(data.defaultValue));
        }
        
        if (selectedType === 'CHECKBOX') {
          return data.defaultValue === true || data.defaultValue === 'true' || data.defaultValue === 'True';
        }
        
        if (selectedType === 'RATING' || selectedType === 'PROGRESS' || selectedType === 'YEAR') {
          return typeof data.defaultValue === 'number' ? data.defaultValue : parseInt(String(data.defaultValue), 10);
        }
        
        if (selectedType === 'MULTI_SELECT') {
          return Array.isArray(data.defaultValue) ? data.defaultValue : [data.defaultValue].filter(Boolean);
        }
        
        if (selectedType === 'VOTE') {
          return data.defaultValue || null;
        }
        
        // For dates and strings, return as-is
        return data.defaultValue;
      })(),
    };
  }, []);

  // Calculate position for new column
  const getNextPosition = useCallback(() => {
    if (existingColumns.length === 0) return 0;
    return Math.max(...existingColumns.map(c => c.position)) + 1;
  }, [existingColumns]);

  return {
    form,
    selectedType,
    originalType,
    selectedLinkedBoardId,
    workspaceId,
    availableBoards,
    linkedBoardColumns,
    convertFormDataToColumn,
    getNextPosition,
  };
};

