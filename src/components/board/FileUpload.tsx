// Re-export EnhancedFileUpload as FileUpload for backward compatibility
export { EnhancedFileUpload as FileUpload } from './EnhancedFileUpload';

// Keep the original component available if needed
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react';
import { fileAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  itemId: string;
  onUploadSuccess?: () => void;
  className?: string;
  maxFileSize?: number; // in bytes, default 5MB
}

export const FileUploadLegacy: React.FC<FileUploadProps> = ({
  itemId,
  onUploadSuccess,
  className,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the maximum size of ${formatFileSize(maxFileSize)}`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const file of selectedFiles) {
        try {
          const fileData = await convertFileToBase64(file);
          
          await fileAPI.uploadFile({
            itemId,
            fileName: file.name,
            fileData,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
          });

          successCount++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
        setSelectedFiles([]);
        onUploadSuccess?.();
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Upload Failed',
          description: 'Failed to upload files',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          id="file-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
        <span className="text-xs text-muted-foreground">
          Max {formatFileSize(maxFileSize)} per file
        </span>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-md bg-slate-50"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

