import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  File,
  Download,
  Trash2,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  FileCode,
  Eye,
  X,
} from 'lucide-react';
import { fileAPI } from '@/lib/api';
import { ItemFile } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface FilePreviewProps {
  file: ItemFile;
  onDelete?: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('text') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('code') || mimeType.includes('json') || mimeType.includes('xml')) return FileCode;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

const isPreviewable = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('image/') ||
    mimeType.includes('pdf') ||
    mimeType.includes('text') ||
    mimeType.startsWith('video/')
  );
};

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onDelete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const FileIcon = getFileIcon(file.mimeType);
  const canDelete = file.uploadedBy === user?.id;

  const handleDownload = async () => {
    try {
      const blob = await fileAPI.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fileAPI.deleteFile(file.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'File deleted successfully',
        });
        onDelete?.();
      } else {
        throw new Error(response.message || 'Failed to delete file');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePreview = () => {
    if (isPreviewable(file.mimeType)) {
      const url = fileAPI.getFilePreviewUrl(file.id);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } else {
      handleDownload();
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
        <div className="flex-shrink-0">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileIcon className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.fileName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {formatFileSize(file.fileSize)}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
            </span>
            {file.uploader && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  by {file.uploader.name}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isPreviewable(file.mimeType) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handlePreview}
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{file.fileName}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="mt-4">
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={file.fileName}
                  className="max-w-full h-auto rounded-lg"
                  onError={(e) => {
                    // Silently handle 400/404 errors for images user doesn't have access to
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    // Optionally show a placeholder
                    if (!img.nextElementSibling || !img.nextElementSibling.classList.contains('error-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'error-placeholder p-8 text-center text-muted-foreground';
                      placeholder.textContent = 'Unable to load preview';
                      img.parentElement?.appendChild(placeholder);
                    }
                  }}
                />
              ) : file.mimeType.includes('pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] rounded-lg border"
                  title={file.fileName}
                  // Note: iframes don't have onError, but browser will show 400 in console
                  // We handle this gracefully by catching errors when fetching files
                />
              ) : file.mimeType.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-auto rounded-lg"
                  onError={() => {
                    // Silently handle 400/404 errors for videos user doesn't have access to
                    console.warn('Failed to load video preview');
                  }}
                />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] rounded-lg border"
                  title={file.fileName}
                  // Note: iframes don't have onError, but browser will show 400 in console
                  // We handle this gracefully by catching errors when fetching files
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

