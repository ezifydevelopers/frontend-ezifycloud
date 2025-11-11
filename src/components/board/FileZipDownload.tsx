import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { fileAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

import JSZip from 'jszip';

interface FileZipDownloadProps {
  fileIds: string[];
  itemIds?: string[];
  fileName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Component to download multiple files as a ZIP archive
 * Uses JSZip to create ZIP on client-side
 */
export const FileZipDownload: React.FC<FileZipDownloadProps> = ({
  fileIds,
  itemIds,
  fileName = 'files.zip',
  variant = 'default',
  size = 'default',
  className,
}) => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const downloadFilesAsZip = async () => {
    if (fileIds.length === 0 && (!itemIds || itemIds.length === 0)) {
      toast({
        title: 'Error',
        description: 'No files to download',
        variant: 'destructive',
      });
      return;
    }

    try {
      setDownloading(true);

      // If itemIds provided, get files from those items
      let files: any[] = [];
      if (itemIds && itemIds.length > 0) {
        const response = await fileAPI.getFilesForBulkDownload(itemIds);
        if (response.success && response.data) {
          files = response.data as any[];
        }
      } else {
        // If fileIds provided, fetch each file individually
        // Note: This is less efficient, prefer itemIds when possible
        const filePromises = fileIds.map(async (fileId) => {
          try {
            const response = await fileAPI.getFileById(fileId);
            if (response.success && response.data) {
              return response.data;
            }
            return null;
          } catch (error) {
            console.error(`Failed to fetch file ${fileId}:`, error);
            return null;
          }
        });

        const fileResults = await Promise.all(filePromises);
        files = fileResults.filter((f): f is any => f !== null);
      }

      if (files.length === 0) {
        toast({
          title: 'Error',
          description: 'No files found to download',
          variant: 'destructive',
        });
        return;
      }

      // Create ZIP archive
      const zip = new JSZip();

      // Download each file and add to ZIP
      const downloadPromises = files.map(async (file: any) => {
        try {
          const blob = await fileAPI.downloadFile(file.id);
          
          // Create a safe filename (remove special characters)
          const safeFileName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
          
          // If file belongs to an item, organize by item name
          const folder = file.item?.name 
            ? `${file.item.name.replace(/[^a-zA-Z0-9._-]/g, '_')}/`
            : '';
          
          zip.file(`${folder}${safeFileName}`, blob);
        } catch (error) {
          console.error(`Failed to download file ${file.id}:`, error);
          toast({
            title: 'Warning',
            description: `Failed to download ${file.fileName}`,
            variant: 'destructive',
          });
        }
      });

      await Promise.all(downloadPromises);

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Downloaded ${files.length} file(s) as ${fileName}`,
      });
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ZIP file',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={downloadFilesAsZip}
      disabled={downloading || (fileIds.length === 0 && (!itemIds || itemIds.length === 0))}
      className={className}
    >
      {downloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Creating ZIP...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Download All ({fileIds.length > 0 ? fileIds.length : itemIds?.length || 0} files)
        </>
      )}
    </Button>
  );
};

