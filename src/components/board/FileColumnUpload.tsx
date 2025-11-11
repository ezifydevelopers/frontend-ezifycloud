import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File as FileIcon, Loader2, Image as ImageIcon, FileText, Eye } from 'lucide-react';
import { fileAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ItemFile } from '@/types/workspace';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FileColumnUploadProps {
  itemId: string;
  columnId: string;
  value: string | string[] | null | undefined; // File ID(s)
  fileType: 'single' | 'multiple';
  allowedFileTypes?: string[]; // MIME types or extensions
  maxFileSize?: number; // In MB
  onValueChange: (fileIds: string | string[] | null) => void;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

const isFileTypeAllowed = (file: File, allowedTypes?: string[]): boolean => {
  if (!allowedTypes || allowedTypes.length === 0) return true;

  return allowedTypes.some(type => {
    // Handle MIME type patterns like "image/*"
    if (type.includes('*')) {
      const baseType = type.split('/')[0];
      return file.type.startsWith(baseType + '/');
    }
    // Handle specific MIME types like "image/png"
    if (file.type === type) return true;
    // Handle extensions like ".pdf"
    if (type.startsWith('.')) {
      const extension = type.toLowerCase();
      const fileName = file.name.toLowerCase();
      return fileName.endsWith(extension);
    }
    return false;
  });
};

export const FileColumnUpload: React.FC<FileColumnUploadProps> = ({
  itemId,
  columnId,
  value,
  fileType,
  allowedFileTypes = [],
  maxFileSize = 5,
  onValueChange,
  className,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<ItemFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [previewFile, setPreviewFile] = useState<ItemFile | null>(null);

  // Fetch files by IDs
  useEffect(() => {
    const fetchFiles = async () => {
      setLoadingFiles(true);
      try {
        // Get all files for the item
        const response = await fileAPI.getItemFiles(itemId);
        if (response.success && response.data) {
          const allFiles = (response.data as ItemFile[]) || [];
          // Filter by file IDs stored in cell value
          const fileIds = Array.isArray(value) ? value : value ? [value] : [];
          const columnFiles = allFiles.filter(f => fileIds.includes(f.id));
          setFiles(columnFiles);
        }
      } catch (error) {
        // Handle access denied errors gracefully
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isAccessDenied = 
          errorMessage.includes('Access denied') || 
          errorMessage.includes('access denied') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('400');
        
        if (!isAccessDenied && import.meta.env.DEV) {
          console.error('Error fetching files:', error);
        }
        // Set empty files on any error (access denied or other)
        setFiles([]);
      } finally {
        setLoadingFiles(false);
      }
    };

    if (itemId && value) {
      fetchFiles();
    } else {
      setFiles([]);
      setLoadingFiles(false);
    }
  }, [itemId, value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;

    // Validate file count for single mode
    if (fileType === 'single' && selectedFiles.length > 1) {
      toast({
        title: 'Multiple files not allowed',
        description: 'This column only allows a single file upload',
        variant: 'destructive',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file types and sizes
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      // Check file size
      if (file.size > maxSizeBytes) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the maximum size of ${formatFileSize(maxSizeBytes)}`,
          variant: 'destructive',
        });
        continue;
      }

      // Check file type
      if (!isFileTypeAllowed(file, allowedFileTypes)) {
        toast({
          title: 'File type not allowed',
          description: `${file.name} is not an allowed file type`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Upload files
    try {
      setUploading(true);
      const uploadedFileIds: string[] = [];

      for (const file of validFiles) {
        try {
          const fileData = await convertFileToBase64(file);
          const response = await fileAPI.uploadFile({
            itemId,
            fileName: file.name,
            fileData,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
          });

          if (response.success && response.data) {
            const uploadedFile = response.data as ItemFile;
            uploadedFileIds.push(uploadedFile.id);
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      if (uploadedFileIds.length > 0) {
        // Update cell value with new file IDs
        if (fileType === 'single') {
          onValueChange(uploadedFileIds[0]);
        } else {
          const existingIds = Array.isArray(value) ? value : value ? [value] : [];
          onValueChange([...existingIds, ...uploadedFileIds]);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fileAPI.deleteFile(fileId);
      if (response.success) {
        // Remove from cell value
        if (fileType === 'single') {
          onValueChange(null);
        } else {
          const currentIds = Array.isArray(value) ? value : value ? [value] : [];
          onValueChange(currentIds.filter(id => id !== fileId));
        }
        toast({
          title: 'Success',
          description: 'File deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.includes('pdf')) return FileText;
    return FileIcon;
  };

  const isPreviewable = (mimeType: string): boolean => {
    return mimeType.startsWith('image/') || mimeType.includes('pdf');
  };

  const handlePreview = (file: ItemFile) => {
    if (isPreviewable(file.mimeType)) {
      setPreviewFile(file);
    } else {
      // Download if not previewable
      const url = fileAPI.getFilePreviewUrl(file.id);
      window.open(url, '_blank');
    }
  };

  if (loadingFiles) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            multiple={fileType === 'multiple'}
            className="hidden"
            id={`file-upload-${columnId}`}
            accept={allowedFileTypes?.join(',')}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload File' + (fileType === 'multiple' ? 's' : '')}
          </Button>
          <span className="text-xs text-muted-foreground">
            Max {formatFileSize(maxFileSize * 1024 * 1024)} {allowedFileTypes.length > 0 ? `• ${allowedFileTypes.join(', ')}` : ''}
          </span>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 border rounded-md bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isPreviewable(file.mimeType) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handlePreview(file)}
                        title="Preview"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteFile(file.id)}
                      title="Delete"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewFile?.fileName}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="mt-4">
              {previewFile.mimeType.startsWith('image/') ? (
                <img
                  src={fileAPI.getFilePreviewUrl(previewFile.id)}
                  onError={(e) => {
                    // Silently handle 400/404 errors for images user doesn't have access to
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  alt={previewFile.fileName}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : previewFile.mimeType.includes('pdf') ? (
                <iframe
                  src={fileAPI.getFilePreviewUrl(previewFile.id)}
                  onError={(e) => {
                    // Silently handle 400/404 errors for images user doesn't have access to
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  className="w-full h-[600px] rounded-lg border"
                  title={previewFile.fileName}
                />
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

