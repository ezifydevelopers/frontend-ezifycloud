import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  RefreshCw,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  ZoomIn,
  FileText,
  Filter,
  Folder,
  Archive,
  FilePen,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  Calendar,
  FileDown,
} from 'lucide-react';
import { boardAPI, fileAPI } from '@/lib/api';
import { Item, Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FileManagementDialog } from './FileManagementDialog';
import { FileCard } from './FileCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BoardGalleryViewProps {
  boardId: string;
  columns?: Column[];
  onItemCreate?: () => void;
  onItemEdit?: (item: Item) => void;
  onItemDelete?: (item: Item) => void;
  onColumnsChange?: () => void;
}

interface FileData {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  itemId: string;
  itemName?: string;
  url?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export const BoardGalleryView: React.FC<BoardGalleryViewProps> = ({
  boardId,
  columns = [],
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileColumn, setFileColumn] = useState<Column | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'pdf' | 'document' | 'video' | 'audio' | 'other'>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [groupByItem, setGroupByItem] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    // Find FILE column
    const fileCol = columns.find(col => col.type === 'FILE' && !col.isHidden);
    setFileColumn(fileCol || null);
  }, [columns]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        const responseData = response.data as { data?: unknown[]; items?: unknown[] };
        const itemsData = (responseData.data || responseData.items || []) as Item[];
        setItems(itemsData);
        
        // Fetch files for all items
        await fetchAllFiles(itemsData);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch items',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  const fetchAllFiles = async (itemsList: Item[]) => {
    try {
      const filePromises = itemsList.map(async (item) => {
        try {
          const response = await fileAPI.getItemFiles(item.id);
          if (response.success && response.data) {
            const filesData = Array.isArray(response.data) ? response.data : [];
            return filesData.map((file: Record<string, unknown>) => ({
              ...file,
              itemId: item.id,
              itemName: item.name,
              url: fileAPI.getFilePreviewUrl(String(file.id || '')),
              uploadedAt: file.uploadedAt || file.createdAt,
              createdAt: file.createdAt || file.uploadedAt,
            }));
          }
          return [];
        } catch (error) {
          // Silently handle access denied/400 errors - user might not have access to some items
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isAccessDenied = 
            errorMessage.includes('Access denied') || 
            errorMessage.includes('access denied') ||
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('400') ||
            errorMessage.includes('Bad Request');
          
          if (isAccessDenied) {
            // Don't log access denied errors - this is expected for items user can't access
            return [];
          }
          // Only log unexpected errors in development (skip 400/404 errors silently)
          if (import.meta.env.DEV && !errorMessage.includes('400') && !errorMessage.includes('404')) {
            console.warn(`Error fetching files for item ${item.id}:`, errorMessage);
          }
          return [];
        }
      });

      const allFiles = (await Promise.all(filePromises)).flat();
      setFiles(allFiles as FileData[]);
    } catch (error) {
      // Only log unexpected errors
      if (import.meta.env.DEV) {
        console.error('Error fetching files:', error);
      }
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDownload = async (file: FileData) => {
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

  const handleDelete = async (file: FileData) => {
    if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
      return;
    }

    try {
      const response = await fileAPI.deleteFile(file.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'File deleted successfully',
        });
        fetchItems();
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
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <File className="h-8 w-8" />;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isPDF = (mimeType: string) => mimeType === 'application/pdf';
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');
  const isAudio = (mimeType: string) => mimeType.startsWith('audio/');
  const isDocument = (mimeType: string) => 
    mimeType.includes('word') || 
    mimeType.includes('excel') || 
    mimeType.includes('sheet') ||
    mimeType.includes('text') ||
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = files
    .filter(file => {
      const matchesSearch = 
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.itemName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = 
        filterType === 'all' ||
        (filterType === 'image' && isImage(file.mimeType)) ||
        (filterType === 'pdf' && isPDF(file.mimeType)) ||
        (filterType === 'document' && isDocument(file.mimeType)) ||
        (filterType === 'video' && isVideo(file.mimeType)) ||
        (filterType === 'audio' && isAudio(file.mimeType)) ||
        (filterType === 'other' && 
         !isImage(file.mimeType) && 
         !isPDF(file.mimeType) && 
         !isDocument(file.mimeType) && 
         !isVideo(file.mimeType) && 
         !isAudio(file.mimeType));
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.fileName.localeCompare(b.fileName);
      } else if (sortBy === 'date') {
        // Sort by uploadedAt or createdAt
        const dateA = new Date(a.uploadedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.uploadedAt || b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'size') {
        comparison = a.fileSize - b.fileSize;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get files for lightbox (only images and PDFs)
  const lightboxFiles = filteredFiles.filter(f => isImage(f.mimeType) || isPDF(f.mimeType));

  const openLightbox = (file: FileData) => {
    const index = lightboxFiles.findIndex(f => f.id === file.id);
    if (index !== -1) {
      setLightboxIndex(index);
      setSelectedFile(lightboxFiles[index]);
      setLightboxOpen(true);
    }
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      const newIndex = lightboxIndex > 0 ? lightboxIndex - 1 : lightboxFiles.length - 1;
      setLightboxIndex(newIndex);
      setSelectedFile(lightboxFiles[newIndex]);
    } else {
      const newIndex = lightboxIndex < lightboxFiles.length - 1 ? lightboxIndex + 1 : 0;
      setLightboxIndex(newIndex);
      setSelectedFile(lightboxFiles[newIndex]);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || lightboxFiles.length === 0) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const newIndex = lightboxIndex > 0 ? lightboxIndex - 1 : lightboxFiles.length - 1;
        setLightboxIndex(newIndex);
        setSelectedFile(lightboxFiles[newIndex]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newIndex = lightboxIndex < lightboxFiles.length - 1 ? lightboxIndex + 1 : 0;
        setLightboxIndex(newIndex);
        setSelectedFile(lightboxFiles[newIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen, lightboxIndex, lightboxFiles]);

  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select files to download',
        variant: 'destructive',
      });
      return;
    }

    try {
      const fileArray = Array.from(selectedFiles);
      const itemIds = [...new Set(filteredFiles.filter(f => fileArray.includes(f.id)).map(f => f.itemId))];
      
      const response = await fileAPI.bulkDownload(itemIds);
      if (response.success && response.data) {
        // Create ZIP using JSZip on frontend
        toast({
          title: 'Info',
          description: 'Bulk download initiated. Creating ZIP file...',
        });
        
        // For now, download files individually
        // In production, you'd use JSZip to create a ZIP
        fileArray.forEach(async (fileId) => {
          const file = filteredFiles.find(f => f.id === fileId);
          if (file) {
            await handleDownload(file);
          }
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to prepare bulk download',
        variant: 'destructive',
      });
    }
  };

  const groupedFiles = groupByItem
    ? filteredFiles.reduce((acc, file) => {
        const key = file.itemId;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(file);
        return acc;
      }, {} as Record<string, FileData[]>)
    : null;

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fileColumn && files.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Files Found</h3>
          <p className="text-muted-foreground mb-4">
            Gallery view displays files from FILE columns. Upload files to items to see them here.
          </p>
          {onItemCreate && (
            <Button onClick={onItemCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Item
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5" />
              <span>File Gallery ({filteredFiles.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={(value: typeof filterType) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="groupByItem"
                  checked={groupByItem}
                  onCheckedChange={(checked) => setGroupByItem(checked as boolean)}
                />
                <Label htmlFor="groupByItem" className="cursor-pointer text-sm">
                  Group by Item
                </Label>
              </div>
              {selectedFiles.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDownload}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download ({selectedFiles.size})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles(new Set())}
                  >
                    Clear Selection
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchItems}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {onItemCreate && (
                <Button onClick={onItemCreate} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Item
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files found. {searchTerm && 'Try adjusting your search.'}</p>
            </div>
          ) : groupByItem ? (
            <div className="space-y-6">
              {Object.entries(groupedFiles || {}).map(([itemId, itemFiles]) => (
                <div key={itemId} className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">
                      {itemFiles[0]?.itemName || 'Unknown Item'}
                    </h3>
                    <Badge variant="outline">{itemFiles.length} files</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {itemFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        selected={selectedFiles.has(file.id)}
                        onSelect={(checked) => {
                          const newSet = new Set(selectedFiles);
                          if (checked) {
                            newSet.add(file.id);
                          } else {
                            newSet.delete(file.id);
                          }
                          setSelectedFiles(newSet);
                        }}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onRename={() => fetchItems()}
                        onMove={() => fetchItems()}
                        items={items}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  selected={selectedFiles.has(file.id)}
                  onSelect={(checked) => {
                    const newSet = new Set(selectedFiles);
                    if (checked) {
                      newSet.add(file.id);
                    } else {
                      newSet.delete(file.id);
                    }
                    setSelectedFiles(newSet);
                  }}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onRename={() => fetchItems()}
                  onMove={() => fetchItems()}
                  items={items}
                  onPreview={(file) => {
                    const fileData = file as FileData;
                    if (isImage(fileData.mimeType) || isPDF(fileData.mimeType)) {
                      openLightbox(fileData);
                    } else {
                      setSelectedFile(fileData);
                      setPreviewOpen(true);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Viewer */}
      {lightboxOpen && selectedFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {lightboxFiles.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('prev');
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox('next');
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* File info */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center z-10 bg-black/50 rounded-lg px-4 py-2">
            <p className="font-medium">{selectedFile.fileName}</p>
            <p className="text-sm text-white/70">
              {lightboxIndex + 1} of {lightboxFiles.length}
              {selectedFile.itemName && ` • From: ${selectedFile.itemName}`}
            </p>
          </div>

          {/* Content */}
          <div 
            className="max-w-[95vw] max-h-[95vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage(selectedFile.mimeType) && selectedFile.url ? (
              <img
                src={selectedFile.url}
                alt={selectedFile.fileName}
                className="max-w-full max-h-[95vh] object-contain"
                style={{ imageRendering: 'high-quality' }}
              />
            ) : isPDF(selectedFile.mimeType) && selectedFile.url ? (
              <div className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden">
                <iframe
                  src={selectedFile.url}
                  className="w-full h-full border-0"
                  title={selectedFile.fileName}
                />
              </div>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                selectedFile && handleDownload(selectedFile);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {selectedFile.itemId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const item = items.find(i => i.id === selectedFile.itemId);
                  if (item && onItemEdit) {
                    onItemEdit(item);
                    setLightboxOpen(false);
                  }
                }}
              >
                View Item
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Full View Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
          {selectedFile && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="truncate">{selectedFile.fileName}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedFile.itemName && (
                        <span>From: {selectedFile.itemName}</span>
                      )}
                      {selectedFile.fileSize && (
                        <span className="ml-2">
                          • {formatFileSize(selectedFile.fileSize)}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedFile && handleDownload(selectedFile)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {selectedFile.itemId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const item = items.find(i => i.id === selectedFile.itemId);
                          if (item && onItemEdit) {
                            onItemEdit(item);
                            setPreviewOpen(false);
                          }
                        }}
                      >
                        View Item
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (selectedFile && confirm(`Delete "${selectedFile.fileName}"?`)) {
                          handleDelete(selectedFile);
                          setPreviewOpen(false);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto p-6 bg-slate-50">
                {isImage(selectedFile.mimeType) && selectedFile.url ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.fileName}
                      className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
                      style={{ imageRendering: 'high-quality' }}
                    />
                  </div>
                ) : selectedFile.mimeType === 'application/pdf' && selectedFile.url ? (
                  <div className="w-full h-[75vh] border rounded-lg bg-white shadow-lg overflow-hidden">
                    <iframe
                      src={selectedFile.url}
                      className="w-full h-full border-0"
                      title={selectedFile.fileName}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                    <div className="mb-4">
                      {getFileIcon(selectedFile.mimeType)}
                    </div>
                    <p className="text-lg font-medium text-foreground mb-2">{selectedFile.fileName}</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {selectedFile.fileSize && formatFileSize(selectedFile.fileSize)}
                      {selectedFile.mimeType && ` • ${selectedFile.mimeType}`}
                    </p>
                    <Button
                      variant="default"
                      onClick={() => selectedFile && handleDownload(selectedFile)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

