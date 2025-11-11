import React, { useState, useRef, useEffect } from 'react';
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
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
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

interface EnhancedFilePreviewProps {
  file: ItemFile;
  onDelete?: () => void;
  onReplace?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  files?: ItemFile[]; // For gallery navigation
  currentIndex?: number; // Current file index in gallery
  onNavigate?: (index: number) => void; // Navigate to next/prev file
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

const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

const isPDF = (mimeType: string): boolean => {
  return mimeType.includes('pdf');
};

const isVideo = (mimeType: string): boolean => {
  return mimeType.startsWith('video/');
};

export const EnhancedFilePreview: React.FC<EnhancedFilePreviewProps> = ({
  file,
  onDelete,
  onReplace,
  onRename,
  onMove,
  files = [],
  currentIndex = 0,
  onNavigate,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const FileIcon = getFileIcon(file.mimeType);
  const canDelete = file.uploadedBy === user?.id;
  const canEdit = file.uploadedBy === user?.id;
  const hasNavigation = files.length > 1 && onNavigate;

  // Load thumbnail for images
  useEffect(() => {
    if (isImage(file.mimeType)) {
      const url = fileAPI.getFilePreviewUrl(file.id);
      setThumbnailUrl(url);
    }
  }, [file.id, file.mimeType]);

  // Load preview URL when dialog opens
  useEffect(() => {
    if (previewOpen && isPreviewable(file.mimeType)) {
      const url = fileAPI.getFilePreviewUrl(file.id);
      setPreviewUrl(url);
      setImageError(false);
      setZoom(1);
      setRotation(0);
    }
  }, [previewOpen, file.id, file.mimeType]);

  // Keyboard navigation
  useEffect(() => {
    if (!previewOpen || !hasNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < files.length - 1) {
        onNavigate(currentIndex + 1);
      } else if (e.key === 'Escape') {
        setPreviewOpen(false);
        setFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewOpen, hasNavigation, currentIndex, files.length, onNavigate]);

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
      toast({
        title: 'Success',
        description: 'File downloaded successfully',
      });
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
        setPreviewOpen(false);
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
      setPreviewOpen(true);
    } else {
      handleDownload();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const navigateToFile = (direction: 'prev' | 'next') => {
    if (!hasNavigation) return;
    
    if (direction === 'prev' && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < files.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {isImage(file.mimeType) && thumbnailUrl ? (
            <div
              className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 cursor-pointer"
              onClick={handlePreview}
            >
              <img
                src={thumbnailUrl}
                alt={file.fileName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileIcon className="h-8 w-8 text-blue-600" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.fileName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
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

        {/* Actions */}
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
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onRename && (
                  <DropdownMenuItem onClick={onRename}>
                    <FileText className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                )}
                {onReplace && (
                  <DropdownMenuItem onClick={onReplace}>
                    <RotateCw className="h-4 w-4 mr-2" />
                    Replace
                  </DropdownMenuItem>
                )}
                {onMove && (
                  <DropdownMenuItem onClick={onMove}>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Move
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canDelete && !canEdit && (
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

      {/* Enhanced Preview Dialog with Lightbox */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className={`p-0 bg-black/95 border-none ${
            fullscreen
              ? 'max-w-none max-h-none w-screen h-screen rounded-none'
              : 'max-w-6xl max-h-[95vh]'
          }`}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/80 text-white z-10">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {hasNavigation && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={() => navigateToFile('prev')}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm text-white/70">
                      {currentIndex + 1} / {files.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={() => navigateToFile('next')}
                      disabled={currentIndex === files.length - 1}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.fileName}</p>
                  <p className="text-xs text-white/70">
                    {formatFileSize(file.fileSize)} • {file.mimeType}
                  </p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2">
                {isImage(file.mimeType) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={handleZoomOut}
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={handleZoomIn}
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={handleRotate}
                      title="Rotate"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={handleResetZoom}
                      title="Reset"
                    >
                      Reset
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={handleDownload}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setFullscreen(!fullscreen)}
                  title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  onClick={() => setPreviewOpen(false)}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div
              ref={containerRef}
              className="flex-1 overflow-auto flex items-center justify-center p-4"
              style={{ backgroundColor: isImage(file.mimeType) ? '#000' : '#1a1a1a' }}
            >
              {previewUrl && (
                <>
                  {isImage(file.mimeType) ? (
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt={file.fileName}
                      className="max-w-full max-h-full object-contain transition-transform duration-200"
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      }}
                      onError={() => {
                        setImageError(true);
                        toast({
                          title: 'Error',
                          description: 'Failed to load image preview',
                          variant: 'destructive',
                        });
                      }}
                    />
                  ) : isPDF(file.mimeType) ? (
                    <iframe
                      src={`${previewUrl}#page=1`}
                      className="w-full h-full rounded-lg border-0"
                      title={file.fileName}
                    />
                  ) : isVideo(file.mimeType) ? (
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-full max-h-full rounded-lg"
                      autoPlay
                    />
                  ) : (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full rounded-lg border-0"
                      title={file.fileName}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

