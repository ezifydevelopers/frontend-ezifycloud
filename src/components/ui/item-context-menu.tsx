import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit, Copy, Trash2, Eye, MessageSquare, Paperclip, CheckCircle2 } from 'lucide-react';

interface ItemContextMenuProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onView?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onComment?: () => void;
  onAttachFile?: () => void;
  onApprove?: () => void;
  disabled?: boolean;
}

export const ItemContextMenu: React.FC<ItemContextMenuProps> = ({
  children,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
  onComment,
  onAttachFile,
  onApprove,
  disabled,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onView && (
          <ContextMenuItem onClick={onView} disabled={disabled}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
            <ContextMenuShortcut>Enter</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onEdit && (
          <ContextMenuItem onClick={onEdit} disabled={disabled}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
            <ContextMenuShortcut>E</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={onDuplicate} disabled={disabled}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
            <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {(onComment || onAttachFile || onApprove) && (
          <>
            <ContextMenuSeparator />
            {onComment && (
              <ContextMenuItem onClick={onComment} disabled={disabled}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Add Comment</span>
              </ContextMenuItem>
            )}
            {onAttachFile && (
              <ContextMenuItem onClick={onAttachFile} disabled={disabled}>
                <Paperclip className="mr-2 h-4 w-4" />
                <span>Attach File</span>
              </ContextMenuItem>
            )}
            {onApprove && (
              <ContextMenuItem onClick={onApprove} disabled={disabled}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span>Approve</span>
              </ContextMenuItem>
            )}
          </>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={onDelete}
              disabled={disabled}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

