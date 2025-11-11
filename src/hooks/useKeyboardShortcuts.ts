import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

/**
 * Hook for keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore typing in inputs/textareas/contenteditable
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const evKey = (event.key || '').toLowerCase();
      for (const shortcut of shortcuts) {
        if (!shortcut?.key) continue;
        const matches =
          evKey === (shortcut.key || '').toLowerCase() &&
          (shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey) &&
          (shortcut.shiftKey ? event.shiftKey : !event.shiftKey) &&
          (shortcut.altKey ? event.altKey : !event.altKey);

        if (matches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Common keyboard shortcuts for the application
 */
export const commonShortcuts = {
  // Navigation
  search: { key: 'k', ctrlKey: true, description: 'Open search' },
  newItem: { key: 'n', ctrlKey: true, description: 'Create new item' },
  newBoard: { key: 'b', ctrlKey: true, description: 'Create new board' },
  
  // Actions
  save: { key: 's', ctrlKey: true, description: 'Save' },
  delete: { key: 'Delete', description: 'Delete selected' },
  duplicate: { key: 'd', ctrlKey: true, description: 'Duplicate item' },
  
  // View
  toggleSidebar: { key: 'b', ctrlKey: true, shiftKey: true, description: 'Toggle sidebar' },
  
  // Selection
  selectAll: { key: 'a', ctrlKey: true, description: 'Select all' },
  escape: { key: 'Escape', description: 'Cancel / Close' },
};

