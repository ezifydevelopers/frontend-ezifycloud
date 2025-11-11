import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem as BaseContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

export interface ContextMenuAction {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  separator?: boolean;
  submenu?: ContextMenuAction[];
}

interface EnhancedContextMenuProps {
  items: ContextMenuAction[];
  children: React.ReactNode;
  className?: string;
}

export const EnhancedContextMenu: React.FC<EnhancedContextMenuProps> = ({
  items,
  children,
  className,
}) => {
  const renderMenuItem = (item: ContextMenuAction, index: number) => {
    if (item.submenu && item.submenu.length > 0) {
      return (
        <ContextMenuSub key={index}>
          <ContextMenuSubTrigger disabled={item.disabled}>
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {item.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      );
    }

    return (
      <React.Fragment key={index}>
        {item.separator && <ContextMenuSeparator />}
        <BaseContextMenuItem
          onClick={item.onClick}
          disabled={item.disabled}
          className={cn(
            item.variant === 'destructive' && 'text-destructive focus:text-destructive'
          )}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
          {item.shortcut && (
            <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
          )}
        </BaseContextMenuItem>
      </React.Fragment>
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className={className}>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {items.map((item, index) => renderMenuItem(item, index))}
      </ContextMenuContent>
    </ContextMenu>
  );
};

