import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  Trash2,
  ZoomIn,
  Image as ImageIcon,
  FileText,
  File,
} from 'lucide-react';
import { FileManagementDialog } from './FileManagementDialog';
import { Item } from '@/types/workspace';

interface FileCardProps {
  file: {
    id: string;
    fileName: string;
    mimeType: string;
    itemId: string;
    url?: string;
  };
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onDownload: (file: unknown) => void;
  onDelete: (file: unknown) => void;
  onRename: () => void;
  onMove: () => void;
  items?: Item[];
  onPreview?: (file: unknown) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  selected,
  onSelect,
  onDownload,
  onDelete,
  onRename,
  onMove,
  items = [],
  onPreview,
}) => {
  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <File className="h-8 w-8" />;
  };

  return (
    <Card
      className={`
        group relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer
        ${selected ? 'ring-2 ring-blue-600' : ''}
      `}
      onClick={() => onPreview?.(file)}
    >
      <CardContent className="p-0 aspect-square relative">
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90"
          />
        </div>

        {isImage(file.mimeType) && file.url ? (
          <img
            src={file.url}
            alt={file.fileName}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : file.mimeType === 'application/pdf' ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
            <FileText className="h-12 w-12 text-red-600 mb-2" />
            <span className="text-xs text-red-700 font-medium text-center px-2 line-clamp-2">
              {file.fileName}
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            {getFileIcon(file.mimeType)}
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.(file);
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <FileManagementDialog
            fileId={file.id}
            currentFileName={file.fileName}
            currentItemId={file.itemId}
            items={items}
            onSuccess={onRename}
            action="rename"
            trigger={
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => e.stopPropagation()}
              >
                Rename
              </Button>
            }
          />
          <FileManagementDialog
            fileId={file.id}
            currentFileName={file.fileName}
            currentItemId={file.itemId}
            items={items}
            onSuccess={onMove}
            action="move"
            trigger={
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => e.stopPropagation()}
              >
                Move
              </Button>
            }
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      
      {/* File name tooltip */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
        {file.fileName}
      </div>
    </Card>
  );
};

