// Hook for managing column settings (widths, pinned columns, order)

import { useState, useEffect, useCallback, useRef } from 'react';
import { Column } from '@/types/workspace';
import { boardAPI } from '@/lib/api';

export const useColumnSettings = (columns: Column[], boardId?: string) => {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, 'left' | 'right' | null>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [rowHeight, setRowHeight] = useState<number>(40); // Default row height in pixels

  // Load all view preferences from localStorage
  useEffect(() => {
    const prefsKey = `tableViewPrefs_${boardId || 'default'}`;
    const savedPrefs = localStorage.getItem(prefsKey);
    
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        if (prefs.columnWidths) setColumnWidths(prefs.columnWidths);
        if (prefs.pinnedColumns) setPinnedColumns(prefs.pinnedColumns);
        if (prefs.columnOrder) setColumnOrder(prefs.columnOrder);
        if (prefs.hiddenColumns) setHiddenColumns(new Set(prefs.hiddenColumns));
        if (prefs.rowHeight) setRowHeight(prefs.rowHeight);
      } catch (error) {
        console.error('Failed to load view preferences:', error);
      }
    } else {
      // Fallback: Load individual settings for backward compatibility
      const widths: Record<string, number> = {};
      columns.forEach(col => {
        const saved = localStorage.getItem(`columnWidth_${col.id}`);
        if (saved) {
          widths[col.id] = parseInt(saved, 10);
        }
      });
      if (Object.keys(widths).length > 0) {
        setColumnWidths(widths);
      }
    }
  }, [columns, boardId]);

  // Save all preferences together
  const saveViewPreferences = useCallback(() => {
    const prefsKey = `tableViewPrefs_${boardId || 'default'}`;
    const prefs = {
      columnWidths,
      pinnedColumns,
      columnOrder,
      hiddenColumns: Array.from(hiddenColumns),
      rowHeight,
    };
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [boardId, columnWidths, pinnedColumns, columnOrder, hiddenColumns, rowHeight]);

  // Use ref to avoid dependency issues
  const saveViewPreferencesRef = useRef(saveViewPreferences);
  saveViewPreferencesRef.current = saveViewPreferences;

  const handleColumnResize = useCallback((columnId: string, width: number) => {
    setColumnWidths(prev => {
      const updated = { ...prev, [columnId]: width };
      // Save immediately and also update preferences
      localStorage.setItem(`columnWidth_${columnId}`, width.toString());
      setTimeout(() => saveViewPreferencesRef.current(), 100); // Debounce
      return updated;
    });
  }, []);

  const handleColumnPin = useCallback((columnId: string, side: 'left' | 'right' | null) => {
    setPinnedColumns(prev => {
      const updated = { ...prev, [columnId]: side };
      localStorage.setItem(`columnPinned_${columnId}`, side || '');
      setTimeout(() => saveViewPreferencesRef.current(), 100); // Debounce
      return updated;
    });
  }, []);

  const handleToggleColumnVisibility = useCallback(async (columnId: string, isHidden: boolean) => {
    setHiddenColumns(prev => {
      const updated = new Set(prev);
      if (isHidden) {
        updated.add(columnId);
      } else {
        updated.delete(columnId);
      }
      setTimeout(() => saveViewPreferencesRef.current(), 100); // Debounce
      return updated;
    });

    // Update column in backend if boardId is provided
    if (boardId) {
      try {
        await boardAPI.updateColumn(columnId, { isHidden });
      } catch (error) {
        console.error('Failed to update column visibility:', error);
        // Revert on error
        setHiddenColumns(prev => {
          const updated = new Set(prev);
          if (isHidden) {
            updated.delete(columnId);
          } else {
            updated.add(columnId);
          }
          return updated;
        });
      }
    }
  }, [boardId]);

  const handleRowHeightChange = useCallback((height: number) => {
    setRowHeight(height);
    setTimeout(() => saveViewPreferencesRef.current(), 100); // Debounce
  }, []);

  // Initialize column order from columns array (sorted by position)
  useEffect(() => {
    if (columns.length > 0) {
      // Try to load saved order from localStorage first
      const savedOrderKey = `columnOrder_${boardId || 'default'}`;
      const savedOrder = localStorage.getItem(savedOrderKey);
      
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder) as string[];
          // Validate that all column IDs exist in current columns
          const validOrder = parsed.filter(id => columns.some(col => col.id === id));
          // Add any missing columns
          const missingColumns = columns
            .filter(col => !validOrder.includes(col.id))
            .sort((a, b) => a.position - b.position)
            .map(col => col.id);
          
          if (validOrder.length > 0 || missingColumns.length > 0) {
            setColumnOrder([...validOrder, ...missingColumns]);
            return;
          }
        } catch (error) {
          console.error('Failed to parse saved column order:', error);
        }
      }
      
      // Fallback to position-based sorting
      const sorted = [...columns].sort((a, b) => a.position - b.position);
      setColumnOrder(sorted.map(col => col.id));
    }
  }, [columns, boardId]);

  // Get ordered columns based on columnOrder state
  const getOrderedColumns = useCallback((cols: Column[]): Column[] => {
    if (columnOrder.length === 0) {
      return [...cols].sort((a, b) => a.position - b.position);
    }
    const orderMap = new Map(columnOrder.map((id, index) => [id, index]));
    return [...cols].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? a.position;
      const bIndex = orderMap.get(b.id) ?? b.position;
      return aIndex - bIndex;
    });
  }, [columnOrder]);

  // Reorder columns
  const handleColumnReorder = useCallback(async (draggedId: string, targetId: string) => {
    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedId);
    const targetIndex = newOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    setColumnOrder(newOrder);

    // Save to backend if boardId is provided
    if (boardId) {
      try {
        // Update positions for all affected columns
        const updates = newOrder.map((columnId, index) => {
          const column = columns.find(c => c.id === columnId);
          if (column && column.position !== index + 1) {
            return boardAPI.updateColumn(columnId, { position: index + 1 });
          }
          return Promise.resolve({ success: true });
        });
        await Promise.all(updates);
      } catch (error) {
        console.error('Failed to save column order:', error);
        // Revert on error
        setColumnOrder(columnOrder);
      }
    } else {
      // Save to localStorage as fallback
      localStorage.setItem(`columnOrder_${boardId || 'default'}`, JSON.stringify(newOrder));
    }
    
    // Update preferences
    setTimeout(() => saveViewPreferencesRef.current(), 100);
  }, [columnOrder, columns, boardId]);

  return {
    columnWidths,
    pinnedColumns,
    columnOrder,
    hiddenColumns,
    rowHeight,
    handleColumnResize,
    handleColumnPin,
    handleColumnReorder,
    handleToggleColumnVisibility,
    handleRowHeightChange,
    getOrderedColumns,
    saveViewPreferences,
  };
};

