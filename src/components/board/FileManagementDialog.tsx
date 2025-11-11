import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FilePen,
  ArrowRightLeft,
  RefreshCw,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { fileAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types/workspace';

interface FileManagementDialogProps {
  fileId: string;
  currentFileName: string;
  currentItemId: string;
  items?: Item[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  action: 'rename' | 'move' | 'replace';
}

export const FileManagementDialog: React.FC<FileManagementDialogProps> = ({
  fileId,
  currentFileName,
  currentItemId,
  items = [],
  onSuccess,
  trigger,
  action,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newFileName, setNewFileName] = useState(currentFileName);
  const [targetItemId, setTargetItemId] = useState<string>('');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setNewFileName(currentFileName);
      setTargetItemId('');
      setReplaceFile(null);
    }
  }, [open, currentFileName]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (action === 'rename') {
        if (!newFileName.trim()) {
          toast({
            title: 'Error',
            description: 'File name cannot be empty',
            variant: 'destructive',
          });
          return;
        }

        const response = await fileAPI.renameFile(fileId, newFileName.trim());
        if (response.success) {
          toast({
            title: 'Success',
            description: 'File renamed successfully',
          });
          setOpen(false);
          onSuccess?.();
        } else {
          throw new Error(response.message || 'Failed to rename file');
        }
      } else if (action === 'move') {
        if (!targetItemId) {
          toast({
            title: 'Error',
            description: 'Please select a target item',
            variant: 'destructive',
          });
          return;
        }

        const response = await fileAPI.moveFile(fileId, targetItemId);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'File moved successfully',
          });
          setOpen(false);
          onSuccess?.();
        } else {
          throw new Error(response.message || 'Failed to move file');
        }
      } else if (action === 'replace') {
        if (!replaceFile) {
          toast({
            title: 'Error',
            description: 'Please select a file to replace with',
            variant: 'destructive',
          });
          return;
        }

        const response = await fileAPI.replaceFile(fileId, replaceFile);
        if (response.success) {
          toast({
            title: 'Success',
            description: 'File replaced successfully. A new version has been created.',
          });
          setOpen(false);
          onSuccess?.();
        } else {
          throw new Error(response.message || 'Failed to replace file');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} file`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            {action === 'rename' ? (
              <>
                <FilePen className="h-4 w-4 mr-2" />
                Rename
              </>
            ) : action === 'move' ? (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Move
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Replace
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'rename' ? 'Rename File' : action === 'move' ? 'Move File' : 'Replace File'}
          </DialogTitle>
          <DialogDescription>
            {action === 'rename'
              ? 'Enter a new name for this file.'
              : action === 'move'
              ? 'Select an item to move this file to.'
              : 'Upload a new file to replace this one. A new version will be created.'}
          </DialogDescription>
        </DialogHeader>

        {action === 'rename' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">File Name</Label>
              <Input
                id="filename"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
          </div>
        ) : action === 'move' ? (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Current Item:</p>
              <p className="font-medium">{items.find(i => i.id === currentItemId)?.name || currentItemId}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetItem">Target Item</Label>
              <Select value={targetItemId} onValueChange={setTargetItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target item" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter(item => item.id !== currentItemId)
                    .map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Current File:</p>
              <p className="font-medium">{currentFileName}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="replaceFile">New File</Label>
              <input
                id="replaceFile"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setReplaceFile(file);
                  }
                }}
                className="w-full"
              />
              {replaceFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {replaceFile.name} ({(replaceFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'rename' ? (
                  <FilePen className="h-4 w-4 mr-2" />
                ) : action === 'move' ? (
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {action === 'rename' ? 'Rename' : action === 'move' ? 'Move' : 'Replace'} File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

