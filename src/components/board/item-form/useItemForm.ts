// Custom hook for item form state management

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Column, Item } from '@/types/workspace';
import { createItemSchema } from './ItemFormValidation';
import { boardAPI, workspaceAPI } from '@/lib/api';

interface UseItemFormProps {
  boardId: string;
  columns: Column[];
  item?: Item | null;
  open: boolean;
}

export const useItemForm = ({ boardId, columns, item, open }: UseItemFormProps) => {
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);

  // Filter visible columns and sort by position
  const visibleColumns = useMemo(() => (
    columns
      .filter(col => !col.isHidden)
      .sort((a, b) => a.position - b.position)
  ), [columns]);

  // Generate schema with workspace members for PEOPLE field validation
  const schema = useMemo(() => createItemSchema(columns, workspaceMembers), [columns, workspaceMembers]);
  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name || '',
      status: item?.status || '',
    },
  });

  const { reset } = form;

  // Fetch board to get workspaceId
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

  // Fetch workspace members
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

  // Initialize form with item data when editing
  useEffect(() => {
    if (!open) return;
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
              if (column.type === 'DATE') {
                defaultValues[`cell_${column.id}`] = dateValue.toISOString().split('T')[0];
              } else {
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
  }, [open, item, visibleColumns, reset]);

  // Convert form data to cells object for API
  const convertFormDataToCells = useCallback((data: FormData): Record<string, unknown> => {
    const cells: Record<string, unknown> = {};
    
    visibleColumns.forEach((column) => {
      const fieldName = `cell_${column.id}` as keyof FormData;
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
          if (typeof value === 'string') {
            try {
              cells[column.id] = JSON.parse(value);
            } catch {
              cells[column.id] = value;
            }
          } else {
            cells[column.id] = value;
          }
        } else {
          cells[column.id] = value;
        }
      }
    });

    return cells;
  }, [visibleColumns]);

  return {
    form,
    visibleColumns,
    workspaceMembers,
    convertFormDataToCells,
  };
};

