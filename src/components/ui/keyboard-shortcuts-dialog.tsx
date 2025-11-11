import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { commonShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  trigger?: React.ReactNode;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  trigger,
}) => {
  const formatKey = (shortcut: { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }) => {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  const categories = [
    {
      title: 'Navigation',
      shortcuts: [
        commonShortcuts.search,
        commonShortcuts.newItem,
        commonShortcuts.newBoard,
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        commonShortcuts.save,
        commonShortcuts.delete,
        commonShortcuts.duplicate,
      ],
    },
    {
      title: 'View',
      shortcuts: [
        commonShortcuts.toggleSidebar,
      ],
    },
    {
      title: 'Selection',
      shortcuts: [
        commonShortcuts.selectAll,
        commonShortcuts.escape,
      ],
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Keyboard className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="font-semibold mb-3 text-sm">{category.title}</h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                      {formatKey(shortcut as any)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

