import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Bookmark,
  Share2,
  Save,
  Eye,
  Star,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { viewAPI, SavedView } from '@/lib/api/viewAPI';
import { ViewType } from '@prisma/client';

// Extended interface for local use (includes view configuration)
interface LocalSavedView extends SavedView {
  viewType: ViewType;
  filters?: Record<string, unknown>;
  columns?: string[]; // Column IDs to show
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isFavorite?: boolean; // Stored in settings
}

interface ViewManagementProps {
  boardId: string;
  currentView: string;
  currentFilters?: Record<string, unknown>;
  columns?: Array<{ id: string; name: string }>;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  onViewChange?: (view: LocalSavedView) => void;
  onSaveView?: (view: LocalSavedView) => void;
  onLoadView?: () => void;
}

export const ViewManagement: React.FC<ViewManagementProps> = ({
  boardId,
  currentView,
  currentFilters = {},
  columns = [],
  currentSortBy,
  currentSortOrder,
  onViewChange,
  onSaveView,
  onLoadView,
}) => {
  const { toast } = useToast();
  const [savedViews, setSavedViews] = useState<LocalSavedView[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [editingView, setEditingView] = useState<LocalSavedView | null>(null);

  // Fetch views from API
  const fetchViews = async () => {
    try {
      setLoading(true);
      const response = await viewAPI.getBoardViews(boardId);
      if (response.success && response.data) {
        // Transform API views to LocalSavedView format
        const transformedViews: LocalSavedView[] = response.data.map(view => {
          const settings = (view.settings || {}) as Record<string, unknown>;
          return {
            ...view,
            viewType: view.type,
            filters: settings.filters as Record<string, unknown> | undefined,
            columns: settings.columns as string[] | undefined,
            sortBy: settings.sortBy as string | undefined,
            sortOrder: settings.sortOrder as 'asc' | 'desc' | undefined,
            isFavorite: settings.isFavorite as boolean | undefined || false,
          };
        });
        setSavedViews(transformedViews);
      }
    } catch (error) {
      console.error('Error fetching views:', error);
      toast({
        title: 'Error',
        description: 'Failed to load views',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViews();
  }, [boardId]);

  const handleSaveView = async () => {
    if (!viewName.trim()) {
      toast({
        title: 'Error',
        description: 'View name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Build settings object with view configuration
      const settings: Record<string, unknown> = {
        filters: currentFilters,
        columns: columns.map(col => col.id),
        ...(currentSortBy && { sortBy: currentSortBy }),
        ...(currentSortOrder && { sortOrder: currentSortOrder }),
      };

      let response;
      if (editingView) {
        // Update existing view
        response = await viewAPI.updateView(editingView.id, {
          name: viewName.trim(),
          description: viewDescription.trim() || undefined,
          settings,
          isDefault,
          isShared,
        });
      } else {
        // Create new view
        response = await viewAPI.createView(boardId, {
          name: viewName.trim(),
          type: currentView.toUpperCase() as ViewType,
          description: viewDescription.trim() || undefined,
          settings,
          isDefault,
          isShared,
        });
      }

      if (response.success) {
        await fetchViews();
        onSaveView?.(response.data as LocalSavedView);
        
        toast({
          title: 'Success',
          description: editingView ? 'View updated successfully' : 'View saved successfully',
        });

        setSaveDialogOpen(false);
        setViewName('');
        setViewDescription('');
        setIsShared(false);
        setIsDefault(false);
        setEditingView(null);
      } else {
        throw new Error(response.message || 'Failed to save view');
      }
    } catch (error) {
      console.error('Error saving view:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save view',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadView = (view: LocalSavedView) => {
    onViewChange?.(view);
    onLoadView?.();
    toast({
      title: 'View Loaded',
      description: `Loaded view: ${view.name}`,
    });
  };

  const handleDeleteView = async (viewId: string) => {
    if (!confirm('Are you sure you want to delete this view?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await viewAPI.deleteView(viewId);
      if (response.success) {
        await fetchViews();
        toast({
          title: 'Success',
          description: 'View deleted',
        });
      } else {
        throw new Error(response.message || 'Failed to delete view');
      }
    } catch (error) {
      console.error('Error deleting view:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete view',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (viewId: string) => {
    try {
      setLoading(true);
      const response = await viewAPI.setDefaultView(viewId);
      if (response.success) {
        await fetchViews();
        toast({
          title: 'Success',
          description: 'Default view updated',
        });
      } else {
        throw new Error(response.message || 'Failed to set default view');
      }
    } catch (error) {
      console.error('Error setting default view:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set default view',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShareView = (view: LocalSavedView) => {
    const shareUrl = `${window.location.origin}/boards/${boardId}?view=${view.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link Copied',
      description: 'View link copied to clipboard',
    });
  };

  const handleEditView = (view: LocalSavedView) => {
    setEditingView(view);
    setViewName(view.name);
    setViewDescription(view.description || '');
    setIsShared(view.isShared || false);
    setIsDefault(view.isDefault || false);
    setSaveDialogOpen(true);
  };

  const defaultViews = savedViews.filter(v => v.isDefault);
  const favoriteViews = savedViews.filter(v => v.isFavorite && !v.isDefault);
  const otherViews = savedViews.filter(v => !v.isFavorite && !v.isDefault);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Views ({savedViews.length})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Saved Views</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current
              </Button>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>Loading views...</p>
              </div>
            ) : savedViews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved views</p>
                <p className="text-xs mt-2">Save your current view to access it later</p>
              </div>
            ) : (
              <div className="divide-y">
                {defaultViews.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-1">Default</p>
                    {defaultViews.map(view => (
                      <SavedViewItem
                        key={view.id}
                        view={view}
                        onLoad={() => handleLoadView(view)}
                        onDelete={() => handleDeleteView(view.id)}
                        onSetDefault={() => handleSetDefault(view.id)}
                        onEdit={() => handleEditView(view)}
                        onShare={() => handleShareView(view)}
                      />
                    ))}
                  </div>
                )}
                {favoriteViews.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-1">Favorites</p>
                    {favoriteViews.map(view => (
                      <SavedViewItem
                        key={view.id}
                        view={view}
                        onLoad={() => handleLoadView(view)}
                        onDelete={() => handleDeleteView(view.id)}
                        onSetDefault={() => handleSetDefault(view.id)}
                        onEdit={() => handleEditView(view)}
                        onShare={() => handleShareView(view)}
                      />
                    ))}
                  </div>
                )}
                {otherViews.length > 0 && (
                  <div className="p-2">
                    {(defaultViews.length > 0 || favoriteViews.length > 0) && (
                      <p className="text-xs font-medium text-muted-foreground px-2 mb-1">Other Views</p>
                    )}
                    {otherViews.map(view => (
                      <SavedViewItem
                        key={view.id}
                        view={view}
                        onLoad={() => handleLoadView(view)}
                        onDelete={() => handleDeleteView(view.id)}
                        onSetDefault={() => handleSetDefault(view.id)}
                        onEdit={() => handleEditView(view)}
                        onShare={() => handleShareView(view)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Save View Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingView ? 'Edit View' : 'Save Current View'}</DialogTitle>
            <DialogDescription>
              {editingView 
                ? 'Update your view settings (filters, columns, sort order).'
                : 'Save your current view settings (filters, columns, sort order) for quick access later.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">View Name *</Label>
              <Input
                id="view-name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="e.g., My Tasks, High Priority Items"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="view-description">Description (optional)</Label>
              <Textarea
                id="view-description"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                placeholder="Describe what this view shows..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label htmlFor="default" className="cursor-pointer flex items-center gap-1">
                <Star className="h-4 w-4" />
                Set as default view
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="shared"
                checked={isShared}
                onCheckedChange={(checked) => setIsShared(checked as boolean)}
              />
              <Label htmlFor="shared" className="cursor-pointer flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                Share with team
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSaveDialogOpen(false);
                setEditingView(null);
                setViewName('');
                setViewDescription('');
                setIsShared(false);
                setIsDefault(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveView} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : editingView ? 'Update View' : 'Save View'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const SavedViewItem: React.FC<{
  view: LocalSavedView;
  onLoad: () => void;
  onDelete: () => void;
  onSetDefault?: () => void;
  onEdit?: () => void;
  onShare: () => void;
}> = ({ view, onLoad, onDelete, onSetDefault, onEdit, onShare }) => {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer group">
      <div className="flex-1 min-w-0" onClick={onLoad}>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{view.name}</p>
            {view.description && (
              <p className="text-xs text-muted-foreground truncate">{view.description}</p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {view.viewType.toLowerCase()} • {view.columns?.length || 0} columns
              </p>
              {view.isDefault && (
                <Badge variant="secondary" className="text-xs">Default</Badge>
              )}
              {view.isShared && (
                <Badge variant="outline" className="text-xs">Shared</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onSetDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault();
            }}
            title={view.isDefault ? 'Default view' : 'Set as default'}
          >
            <Star className={cn('h-3 w-3', view.isDefault && 'fill-yellow-400 text-yellow-400')} />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit view"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          title="Share view"
        >
          <Share2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete view"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

