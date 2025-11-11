import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileGallery } from './FileGallery';
import { File } from 'lucide-react';

interface ItemFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName?: string;
}

export const ItemFilesDialog: React.FC<ItemFilesDialogProps> = ({
  open,
  onOpenChange,
  itemId,
  itemName,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            {itemName ? `Files - ${itemName}` : 'Files'}
          </DialogTitle>
          <DialogDescription>
            Upload and manage files for this item
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <FileGallery itemId={itemId} itemName={itemName} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

