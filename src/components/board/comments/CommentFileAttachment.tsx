import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, File, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fileAPI } from '@/lib/api';

export interface CommentFile {
  id?: string;
  fileName: string;
  filePath?: string;
  fileSize: number;
  mimeType: string;
  fileData?: string; // Base64 for new uploads
}

interface CommentFileAttachmentProps {
  files: CommentFile[];
  onFilesChange: (files: CommentFile[]) => void;
  onRemove?: (index: number) => void;
  itemId: string;
  disabled?: boolean;
}

export const CommentFileAttachment: React.FC<CommentFileAttachmentProps> = ({
  files,
  onFilesChange,
  onRemove,
  itemId,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const newFiles: CommentFile[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Convert to base64
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newFiles.push({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileData: base64Data,
        });
      }

      onFilesChange([...files, ...newFiles]);
    } catch (error) {
      console.error('Error reading files:', error);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    onRemove?.(index);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.includes('pdf')) return FileText;
    return File;
  };

  const handleDownload = async (file: CommentFile, index: number) => {
    if (file.id) {
      // Download from server using comment file API
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/comments/files/${file.id}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    } else if (file.fileData) {
      // Download from base64
      const link = document.createElement('a');
      link.href = file.fileData;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="file"
          id="comment-file-input"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        <label htmlFor="comment-file-input">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            className="cursor-pointer"
            asChild
          >
            <span>
              <File className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Attach Files'}
            </span>
          </Button>
        </label>
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {files.length} {files.length === 1 ? 'file' : 'files'} attached
          </span>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.mimeType);
            const isImage = file.mimeType.startsWith('image/');

            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50"
              >
                {isImage && file.fileData ? (
                  <img
                    src={file.fileData}
                    alt={file.fileName}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-slate-200 rounded">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {file.id && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDownload(file, index)}
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600"
                      onClick={() => handleRemove(index)}
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

