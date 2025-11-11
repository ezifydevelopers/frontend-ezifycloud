import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  File,
  Loader2,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Folder,
  Grid3x3,
  List,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  FileCode,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  X,
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { EnhancedFilePreview } from './EnhancedFilePreview';
import { FileManagementDialog } from './FileManagementDialog';
import { FileZipDownload } from './FileZipDownload';
import { fileAPI } from '@/lib/api';
import { ItemFile, Item } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface EnhancedFileGalleryProps {
  itemId?: string; // Single item - optional
  itemIds?: string[]; // Multiple items - optional
  items?: Item[]; // Items list for grouping
  itemName?: string;
  showUpload?: boolean;
  onFileUpdate?: () => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';
type GroupBy = 'none' | 'item' | 'date' | 'type';
type FileTypeFilter = 'all' | 'image' | 'document' | 'spreadsheet' | 'video' | 'audio' | 'other';

const getFileType = (mimeType: string): FileTypeFilter => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
};

const getFileTypeIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  if (mimeType.includes('code') || mimeType.includes('json') || mimeType.includes('xml')) return FileCode;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

export const EnhancedFileGallery: React.FC<EnhancedFileGalleryProps> = ({
  itemId,
  itemIds,
  items = [],
  itemName,
  showUpload = true,
  onFileUpdate,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<ItemFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<ItemFile | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      let allFiles: ItemFile[] = [];

      if (itemId) {
        // Single item
        const response = await fileAPI.getItemFiles(itemId);
        if (response.success && response.data) {
          allFiles = (response.data as ItemFile[]) || [];
        }
      } else if (itemIds && itemIds.length > 0) {
        // Multiple items - fetch files for each
        const responses = await Promise.all(
          itemIds.map(id => fileAPI.getItemFiles(id))
        );
        
        allFiles = responses
          .filter(res => res.success && res.data)
          .flatMap(res => (res.data as ItemFile[]) || []);
      } else {
        allFiles = [];
      }

      setFiles(allFiles);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAccessDenied = 
        errorMessage.includes('Access denied') || 
        errorMessage.includes('access denied') ||
        errorMessage.includes('Unauthorized');
      
      if (isAccessDenied) {
        setFiles([]);
      } else {
        console.error('Error fetching files:', error);
        toast({
          title: 'Error',
          description: 'Failed to load files',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [itemId, itemIds?.join(',')]);

  const handleUploadSuccess = () => {
    fetchFiles();
    onFileUpdate?.();
  };

  const handleDelete = () => {
    fetchFiles();
    onFileUpdate?.();
  };

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(file =>
        file.fileName.toLowerCase().includes(searchLower) ||
        file.mimeType.toLowerCase().includes(searchLower)
      );
    }

    // File type filter
    if (fileTypeFilter !== 'all') {
      result = result.filter(file => getFileType(file.mimeType) === fileTypeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'type':
          comparison = a.mimeType.localeCompare(b.mimeType);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchTerm, fileTypeFilter, sortBy, sortOrder]);

  // Group files
  const groupedFiles = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Files': filteredAndSortedFiles };
    }

    const groups: Record<string, ItemFile[]> = {};

    if (groupBy === 'item') {
      filteredAndSortedFiles.forEach(file => {
        const itemName = items.find(i => i.id === file.itemId)?.name || 'Unknown Item';
        if (!groups[itemName]) {
          groups[itemName] = [];
        }
        groups[itemName].push(file);
      });
    } else if (groupBy === 'date') {
      filteredAndSortedFiles.forEach(file => {
        const date = format(new Date(file.uploadedAt), 'yyyy-MM-dd');
        const dateLabel = format(new Date(file.uploadedAt), 'MMM dd, yyyy');
        if (!groups[dateLabel]) {
          groups[dateLabel] = [];
        }
        groups[dateLabel].push(file);
      });
    } else if (groupBy === 'type') {
      filteredAndSortedFiles.forEach(file => {
        const type = getFileType(file.mimeType);
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
        if (!groups[typeLabel]) {
          groups[typeLabel] = [];
        }
        groups[typeLabel].push(file);
      });
    }

    // Sort group keys
    const sortedGroups: Record<string, ItemFile[]> = {};
    Object.keys(groups)
      .sort((a, b) => {
        if (groupBy === 'date') {
          return new Date(b).getTime() - new Date(a).getTime();
        }
        return a.localeCompare(b);
      })
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }, [filteredAndSortedFiles, groupBy, items]);

  const handleFileClick = (file: ItemFile, index: number) => {
    setPreviewFile(file);
    setPreviewIndex(index);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!previewFile) return;

    const currentIndex = filteredAndSortedFiles.findIndex(f => f.id === previewFile.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(filteredAndSortedFiles.length - 1, currentIndex + 1);

    setPreviewFile(filteredAndSortedFiles[newIndex]);
    setPreviewIndex(newIndex);
  };

  const handleDownloadSelected = () => {
    const fileIds = Array.from(selectedFiles);
    if (fileIds.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to download',
        variant: 'destructive',
      });
      return;
    }
    // The FileZipDownload component will handle the download
  };

  const toggleFileSelection = (fileId: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(fileId)) {
      newSet.delete(fileId);
    } else {
      newSet.add(fileId);
    }
    setSelectedFiles(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderFileThumbnail = (file: ItemFile, index: number) => {
    const FileIcon = getFileTypeIcon(file.mimeType);
    const isImage = file.mimeType.startsWith('image/');
    const isSelected = selectedFiles.has(file.id);
    const thumbnailUrl = isImage ? fileAPI.getFilePreviewUrl(file.id) : null;

    return (
      <div
        key={file.id}
        className={cn(
          'relative group cursor-pointer rounded-lg border-2 transition-all',
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
        )}
        onClick={() => handleFileClick(file, index)}
      >
        {/* Checkbox */}
        <div
          className="absolute top-2 left-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            toggleFileSelection(file.id);
          }}
        >
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center',
              isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'
            )}
          >
            {isSelected && <X className="h-3 w-3 text-white" />}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="aspect-square bg-slate-100 rounded-t-lg overflow-hidden">
          {isImage && thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={file.fileName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileIcon className="h-12 w-12 text-slate-400" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="p-2 space-y-1">
          <p className="text-xs font-medium truncate" title={file.fileName}>
            {file.fileName}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatFileSize(file.fileSize)}</span>
            <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handleFileClick(file, index);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderFileList = (file: ItemFile, index: number) => {
    const FileIcon = getFileTypeIcon(file.mimeType);
    const isSelected = selectedFiles.has(file.id);
    const canEdit = file.uploadedBy === user?.id;

    return (
      <div
        key={file.id}
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg border transition-colors',
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
        )}
      >
        <div
          className="w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer"
          onClick={() => toggleFileSelection(file.id)}
        >
          {isSelected && <X className="h-3 w-3 text-blue-500" />}
        </div>

        <FileIcon className="h-8 w-8 text-slate-400" />

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.fileName}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatFileSize(file.fileSize)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
            {file.uploader && (
              <>
                <span>•</span>
                <span>by {file.uploader.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileClick(file, index)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canEdit && (
            <FileManagementDialog
              fileId={file.id}
              currentFileName={file.fileName}
              currentItemId={file.itemId}
              items={items}
              onSuccess={handleDelete}
              action="rename"
              trigger={
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              {itemName ? `${itemName} - Files` : 'File Gallery'} ({files.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedFiles.size > 0 && (
                <FileZipDownload
                  fileIds={Array.from(selectedFiles)}
                  fileName="selected-files.zip"
                  variant="outline"
                  size="sm"
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchFiles}
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Upload Section */}
          {showUpload && itemId && (
            <FileUpload
              itemId={itemId}
              onUploadSuccess={handleUploadSuccess}
            />
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* File Type Filter */}
            <Select value={fileTypeFilter} onValueChange={(v) => setFileTypeFilter(v as FileTypeFilter)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[130px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            {/* Group By */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger className="w-[140px]">
                <Folder className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                {itemIds && itemIds.length > 1 && (
                  <SelectItem value="item">By Item</SelectItem>
                )}
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="type">By Type</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Files Display */}
          {filteredAndSortedFiles.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
                <div key={groupName} className="space-y-3">
                  {groupBy !== 'none' && (
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{groupName}</h3>
                      <Badge variant="secondary">{groupFiles.length}</Badge>
                    </div>
                  )}

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {groupFiles.map((file, index) => {
                        const globalIndex = filteredAndSortedFiles.findIndex(f => f.id === file.id);
                        return renderFileThumbnail(file, globalIndex);
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupFiles.map((file, index) => {
                        const globalIndex = filteredAndSortedFiles.findIndex(f => f.id === file.id);
                        return renderFileList(file, globalIndex);
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {searchTerm || fileTypeFilter !== 'all'
                  ? 'No files match your filters'
                  : 'No files uploaded yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewFile && (
        <EnhancedFilePreview
          file={previewFile}
          files={filteredAndSortedFiles}
          currentIndex={previewIndex}
          onNavigate={(index) => {
            setPreviewFile(filteredAndSortedFiles[index]);
            setPreviewIndex(index);
          }}
          onDelete={handleDelete}
          onReplace={() => {
            fetchFiles();
            onFileUpdate?.();
          }}
          onRename={() => {
            fetchFiles();
            onFileUpdate?.();
          }}
          onMove={() => {
            fetchFiles();
            onFileUpdate?.();
          }}
        />
      )}
    </div>
  );
};

