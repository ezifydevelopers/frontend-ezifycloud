import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { MessageSquare } from 'lucide-react';

interface ItemCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName?: string;
  workspaceId?: string;
}

export const ItemCommentsDialog: React.FC<ItemCommentsDialogProps> = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  workspaceId,
}) => {
  const [commentCount, setCommentCount] = React.useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {itemName ? `Comments - ${itemName}` : 'Comments'}
          </DialogTitle>
          <DialogDescription>
            {commentCount > 0 
              ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}`
              : 'No comments yet'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <CommentForm
            itemId={itemId}
            workspaceId={workspaceId}
            onSuccess={() => {
              // Refresh will be handled by CommentList
            }}
          />

          <div className="border-t pt-4">
            <CommentList
              itemId={itemId}
              onCommentCountChange={setCommentCount}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

