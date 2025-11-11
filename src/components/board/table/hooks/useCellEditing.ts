// Hook for managing cell editing state

import { useState, useCallback } from 'react';
import { boardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Column, Item } from '@/types/workspace';
import { validateCellValue } from '../../column-form/utils/columnValidation';
import { validateStatusTransition } from '../utils/cellValueFormatter';
import { getCellValue } from '../utils/tableUtils';

interface UseCellEditingProps {
  columns?: Column[];
  items?: Item[];
  onSaveSuccess?: () => void;
}

export const useCellEditing = ({ columns = [], items = [], onSaveSuccess }: UseCellEditingProps) => {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<unknown>('');
  const [savingCell, setSavingCell] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const startEditing = useCallback((itemId: string, columnId: string, currentValue: unknown) => {
    setEditingCell({ itemId, columnId });
    setEditValue(currentValue);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const saveCell = useCallback(async (itemId: string, columnId: string, value?: unknown) => {
    const valueToSave = value !== undefined ? value : editValue;
    
    // Validate before saving
    const column = columns.find(c => c.id === columnId);
    if (column) {
      // General cell validation
      const validation = validateCellValue(column, valueToSave);
      if (!validation.valid) {
        setValidationError(validation.error || 'Validation failed');
        toast({
          title: 'Validation Error',
          description: validation.error || 'Invalid value',
          variant: 'destructive',
        });
        return; // Don't save if validation fails
      }
      
      // Status workflow validation
      if (column.type === 'STATUS') {
        const item = items.find(i => i.id === itemId);
        if (item) {
          const currentStatus = String(getCellValue(item, columnId) || '');
          const newStatus = String(valueToSave || '');
          
          if (currentStatus !== newStatus) {
            const workflowValidation = validateStatusTransition(currentStatus, newStatus, column);
            if (!workflowValidation.valid) {
              setValidationError(workflowValidation.error || 'Invalid status transition');
              toast({
                title: 'Workflow Validation Error',
                description: workflowValidation.error || 'Invalid status transition',
                variant: 'destructive',
              });
              return; // Don't save if workflow validation fails
            }
          }
        }
      }
    }
    
    setValidationError(null);
    
    try {
      setSavingCell(true);
      
      // Prepare cell data based on value type
      let cellValue = value;
      
      // Handle FILE columns - check if value is already a file ID or array of IDs
      // (FileColumnUpload already handles the upload, so we just save the ID(s))
      
      const response = await boardAPI.updateItem(itemId, {
        cells: {
          [columnId]: valueToSave,
        },
      });

      if (response.success) {
        setEditingCell(null);
        setEditValue('');
        setValidationError(null);
        onSaveSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to save cell');
      }
    } catch (error) {
      console.error('Error saving cell:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save cell',
        variant: 'destructive',
      });
    } finally {
      setSavingCell(false);
    }
  }, [editValue, columns, items, toast, onSaveSuccess]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, itemId: string, columnId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveCell(itemId, columnId, editValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [editValue, saveCell, cancelEditing]);

  return {
    editingCell,
    editValue,
    setEditValue,
    savingCell,
    validationError,
    setValidationError,
    startEditing,
    cancelEditing,
    saveCell,
    handleKeyDown,
  };
};

