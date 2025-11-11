import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File as FileIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fileAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileTypeConfig {
  mimeTypes: string[];
  extensions: string[];
  maxSize: number;
}

interface AllowedFileTypes {
  images?: FileTypeConfig;
  documents?: FileTypeConfig;
  spreadsheets?: FileTypeConfig;
  other?: FileTypeConfig;
}

interface FileUploadProps {
  itemId: string;
  onUploadSuccess?: () => void;
  className?: string;
  maxFileSize?: number; // in bytes, will override if not provided
  allowedTypes?: string[]; // Optional: specific file types to allow
  accept?: string; // HTML accept attribute for file input
}

interface FileWithValidation extends File {
  isValid?: boolean;
  error?: string;
}

export const EnhancedFileUpload: React.FC<FileUploadProps> = ({
  itemId,
  onUploadSuccess,
  className,
  maxFileSize,
  allowedTypes,
  accept,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithValidation[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileTypesConfig, setFileTypesConfig] = useState<AllowedFileTypes | null>(null);
  const [globalMaxSize, setGlobalMaxSize] = useState<number>(5 * 1024 * 1024); // 5MB default
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Fetch allowed file types configuration
  useEffect(() => {
    const fetchFileTypes = async () => {
      try {
        const response = await fileAPI.getAllowedFileTypes();
        if (response.success && response.data) {
          setFileTypesConfig(response.data.allowedTypes);
          setGlobalMaxSize(response.data.globalMaxSize || 5 * 1024 * 1024);
        }
      } catch (error) {
        console.error('Error fetching file types config:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchFileTypes();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileExtension = (filename: string): string => {
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const effectiveMaxSize = maxFileSize || globalMaxSize;
    
    // Check file size
    if (file.size > effectiveMaxSize) {
      return {
        isValid: false,
        error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(effectiveMaxSize)})`,
      };
    }

    // If file types config is loaded, validate against it
    if (fileTypesConfig) {
      const fileExtension = getFileExtension(file.name);
      let isAllowed = false;
      let categoryMaxSize = effectiveMaxSize;

      // Check images
      if (fileTypesConfig.images) {
        if (
          fileTypesConfig.images.mimeTypes.includes(file.type) ||
          fileTypesConfig.images.extensions.includes(fileExtension)
        ) {
          isAllowed = true;
          categoryMaxSize = fileTypesConfig.images.maxSize;
        }
      }

      // Check documents
      if (!isAllowed && fileTypesConfig.documents) {
        if (
          fileTypesConfig.documents.mimeTypes.includes(file.type) ||
          fileTypesConfig.documents.extensions.includes(fileExtension)
        ) {
          isAllowed = true;
          categoryMaxSize = fileTypesConfig.documents.maxSize;
        }
      }

      // Check spreadsheets
      if (!isAllowed && fileTypesConfig.spreadsheets) {
        if (
          fileTypesConfig.spreadsheets.mimeTypes.includes(file.type) ||
          fileTypesConfig.spreadsheets.extensions.includes(fileExtension)
        ) {
          isAllowed = true;
          categoryMaxSize = fileTypesConfig.spreadsheets.maxSize;
        }
      }

      // Check other
      if (!isAllowed && fileTypesConfig.other) {
        if (
          fileTypesConfig.other.mimeTypes.includes(file.type) ||
          fileTypesConfig.other.extensions.includes(fileExtension)
        ) {
          isAllowed = true;
          categoryMaxSize = fileTypesConfig.other.maxSize;
        }
      }

      if (!isAllowed) {
        return {
          isValid: false,
          error: `File type "${fileExtension || file.type}" is not allowed. Supported: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX, CSV), and Other configurable types.`,
        };
      }

      // Check category-specific size limit
      if (file.size > categoryMaxSize) {
        return {
          isValid: false,
          error: `File size (${formatFileSize(file.size)}) exceeds category maximum (${formatFileSize(categoryMaxSize)})`,
        };
      }
    }

    // If specific allowed types are provided, validate against them
    if (allowedTypes && allowedTypes.length > 0) {
      const fileExtension = getFileExtension(file.name);
      if (!allowedTypes.includes(fileExtension) && !allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `File type "${fileExtension || file.type}" is not in the allowed list`,
        };
      }
    }

    return { isValid: true };
  };

  const handleFiles = useCallback((files: File[]) => {
    const validatedFiles: FileWithValidation[] = files.map(file => {
      const validation = validateFile(file);
      return {
        ...file,
        isValid: validation.isValid,
        error: validation.error,
      };
    });

    // Filter valid files
    const validFiles = validatedFiles.filter(f => f.isValid);
    const invalidFiles = validatedFiles.filter(f => !f.isValid);

    // Show errors for invalid files
    invalidFiles.forEach(file => {
      if (file.error) {
        toast({
          title: 'Invalid file',
          description: `${file.name}: ${file.error}`,
          variant: 'destructive',
        });
      }
    });

    // Add valid files to selection
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  }, [fileTypesConfig, maxFileSize, globalMaxSize, allowedTypes, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

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

  // Build accept string from file types config
  const getAcceptString = (): string => {
    if (accept) return accept;
    
    if (!fileTypesConfig) return '';
    
    const extensions: string[] = [];
    if (fileTypesConfig.images) extensions.push(...fileTypesConfig.images.extensions);
    if (fileTypesConfig.documents) extensions.push(...fileTypesConfig.documents.extensions);
    if (fileTypesConfig.spreadsheets) extensions.push(...fileTypesConfig.spreadsheets.extensions);
    if (fileTypesConfig.other) extensions.push(...fileTypesConfig.other.extensions);
    
    return extensions.join(',');
  };

  if (loadingConfig) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drag & Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          uploading && 'opacity-50 pointer-events-none'
        )}
      >
        <Upload className={cn('h-8 w-8 mx-auto mb-2', isDragging ? 'text-primary' : 'text-muted-foreground')} />
        <p className="text-sm font-medium mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          or click to browse
        </p>
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          id="file-upload"
          accept={getAcceptString()}
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
        <p className="text-xs text-muted-foreground mt-2">
          Max {formatFileSize(maxFileSize || globalMaxSize)} per file
        </p>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Selected Files ({selectedFiles.length})</div>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between p-3 border rounded-md',
                file.isValid
                  ? 'bg-slate-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {file.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                )}
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
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
              disabled={uploading || selectedFiles.length === 0 || selectedFiles.some(f => !f.isValid)}
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

