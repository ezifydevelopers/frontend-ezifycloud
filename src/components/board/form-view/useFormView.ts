// Custom hook for form view state management

import { useState, useEffect, useCallback } from 'react';
import { boardAPI, workspaceAPI } from '@/lib/api';
import { Column, Board } from '@/types/workspace';

interface UseFormViewProps {
  boardId: string;
}

export const useFormView = ({ boardId }: UseFormViewProps) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);

  // Fetch board to get workspaceId
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await boardAPI.getBoardById(boardId);
        if (response.success && response.data) {
          const board = response.data as Board;
          if (board.workspaceId) {
            setWorkspaceId(board.workspaceId);
          }
        }
      } catch (error) {
        console.error('Error fetching board:', error);
      }
    };
    if (boardId) {
      fetchBoard();
    }
  }, [boardId]);

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
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  // Convert form data to cells object for API
  const convertFormDataToCells = useCallback((data: Record<string, unknown>, columns: Column[]): Record<string, unknown> => {
    const cells: Record<string, unknown> = {};
    
    columns.forEach((column) => {
      if (column.isHidden) return;
      
      const value = data[column.id];
      if (value !== undefined && value !== null && value !== '') {
        // Handle date conversion
        if (column.type === 'DATE') {
          if (typeof value === 'string') {
            const dateValue = new Date(value);
            cells[column.id] = dateValue.toISOString();
          } else {
            cells[column.id] = value;
          }
        } else if (column.type === 'DATETIME') {
          if (typeof value === 'string') {
            const dateValue = new Date(value);
            cells[column.id] = dateValue.toISOString();
          } else {
            cells[column.id] = value;
          }
        } else if (column.type === 'WEEK') {
          if (typeof value === 'string') {
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
        } else if (column.type === 'NUMBER' || column.type === 'CURRENCY' || column.type === 'PERCENTAGE' || column.type === 'RATING') {
          if (typeof value === 'string' && value.trim() !== '') {
            const numValue = Number(value);
            cells[column.id] = isNaN(numValue) ? value : numValue;
          } else {
            cells[column.id] = value;
          }
        } else {
          cells[column.id] = value;
        }
      }
    });

    return cells;
  }, []);

  return {
    formData,
    setFormData,
    workspaceMembers,
    convertFormDataToCells,
  };
};

