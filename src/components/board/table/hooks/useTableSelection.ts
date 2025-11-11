// Hook for managing table row selection

import { useState, useCallback } from 'react';
import { Item } from '@/types/workspace';

interface UseTableSelectionProps {
  items: Item[];
}

export const useTableSelection = ({ items }: UseTableSelectionProps) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, []);

  const toggleSelectAll = useCallback((filteredItems: Item[]) => {
    setSelectedItems(prev => {
      if (prev.size === filteredItems.length) {
        return new Set();
      } else {
        return new Set(filteredItems.map(item => item.id));
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return {
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    toggleSelectAll,
    clearSelection,
  };
};

