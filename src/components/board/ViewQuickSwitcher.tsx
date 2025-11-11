import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, Search, Clock, Star, Eye, Table, Layout, Calendar, GanttChart, Image, BarChart3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { viewAPI, SavedView } from '@/lib/api/viewAPI';
import { ViewType } from '@prisma/client';

interface ViewQuickSwitcherProps {
  boardId: string;
  currentView: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectView: (view: SavedView) => void;
  onSelectViewType: (viewType: string) => void;
}

interface ViewOption {
  id: string;
  name: string;
  type: 'view' | 'viewType';
  viewType?: ViewType;
  description?: string;
  isDefault?: boolean;
  isShared?: boolean;
  isFavorite?: boolean;
  lastUsed?: Date;
}

const VIEW_TYPE_OPTIONS: Array<{ value: string; label: string; icon: React.ElementType }> = [
  { value: 'table', label: 'Table View', icon: Table },
  { value: 'kanban', label: 'Kanban View', icon: Layout },
  { value: 'calendar', label: 'Calendar View', icon: Calendar },
  { value: 'timeline', label: 'Timeline View', icon: GanttChart },
  { value: 'gallery', label: 'Gallery View', icon: Image },
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { value: 'form', label: 'Form View', icon: FileText },
];

export const ViewQuickSwitcher: React.FC<ViewQuickSwitcherProps> = ({
  boardId,
  currentView,
  open,
  onOpenChange,
  onSelectView,
  onSelectViewType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [recentViews, setRecentViews] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load saved views and recent views
  useEffect(() => {
    if (open && boardId) {
      loadViews();
      loadRecentViews();
    }
  }, [open, boardId]);

  const loadViews = async () => {
    try {
      setLoading(true);
      const response = await viewAPI.getBoardViews(boardId);
      if (response.success && response.data) {
        setSavedViews(response.data);
      }
    } catch (error) {
      console.error('Error loading views:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentViews = () => {
    try {
      const recent = localStorage.getItem(`recent_views_${boardId}`);
      if (recent) {
        setRecentViews(JSON.parse(recent));
      }
    } catch (error) {
      console.error('Error loading recent views:', error);
    }
  };

  const trackViewUsage = (viewId: string) => {
    try {
      const recent = recentViews.filter(id => id !== viewId);
      recent.unshift(viewId);
      const limited = recent.slice(0, 10); // Keep last 10
      localStorage.setItem(`recent_views_${boardId}`, JSON.stringify(limited));
      setRecentViews(limited);
    } catch (error) {
      console.error('Error tracking view usage:', error);
    }
  };

  // Build options list
  const options: ViewOption[] = React.useMemo(() => {
    const opts: ViewOption[] = [];

    // Add saved views
    savedViews.forEach(view => {
      const settings = (view.settings || {}) as Record<string, unknown>;
      opts.push({
        id: view.id,
        name: view.name,
        type: 'view',
        viewType: view.type,
        description: view.description || settings.description as string | undefined,
        isDefault: view.isDefault,
        isShared: view.isShared || settings.isShared as boolean | undefined,
        isFavorite: settings.isFavorite as boolean | undefined || false,
        lastUsed: recentViews.includes(view.id) ? new Date() : undefined,
      });
    });

    // Add view type options
    VIEW_TYPE_OPTIONS.forEach(opt => {
      opts.push({
        id: `viewtype-${opt.value}`,
        name: opt.label,
        type: 'viewType',
        viewType: opt.value.toUpperCase() as ViewType,
      });
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return opts.filter(opt => 
        opt.name.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
      );
    }

    // Sort: default first, then favorites, then recent, then others
    return opts.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.lastUsed && !b.lastUsed) return -1;
      if (!a.lastUsed && b.lastUsed) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [savedViews, recentViews, searchQuery]);

  // Reset selected index when options change
  useEffect(() => {
    setSelectedIndex(0);
  }, [options.length, searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = options[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }, [options, selectedIndex, onOpenChange]);

  const handleSelect = (option: ViewOption) => {
    if (option.type === 'view') {
      const view = savedViews.find(v => v.id === option.id);
      if (view) {
        trackViewUsage(view.id);
        onSelectView(view);
        onOpenChange(false);
      }
    } else {
      onSelectViewType(option.viewType!.toLowerCase());
      onOpenChange(false);
    }
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0" onKeyDown={handleKeyDown}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Quick Switch View
          </DialogTitle>
          <DialogDescription>
            Type to search or use arrow keys to navigate
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search views..."
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading views...
            </div>
          ) : options.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No views found</p>
              <p className="text-xs mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-1">
              {options.map((option, index) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                    index === selectedIndex && "bg-accent",
                    "hover:bg-accent"
                  )}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {option.type === 'view' ? (
                      <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{option.name}</p>
                        {option.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                        {option.isShared && (
                          <Badge variant="outline" className="text-xs">Shared</Badge>
                        )}
                        {option.isFavorite && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {option.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {option.description}
                        </p>
                      )}
                      {option.lastUsed && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Recently used</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-4 border-t pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <span>{options.length} {options.length === 1 ? 'option' : 'options'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook for keyboard shortcut
export const useViewQuickSwitcher = (
  boardId: string,
  currentView: string,
  onSelectView: (view: SavedView) => void,
  onSelectViewType: (viewType: string) => void
) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    open,
    setOpen,
    QuickSwitcher: (
      <ViewQuickSwitcher
        boardId={boardId}
        currentView={currentView}
        open={open}
        onOpenChange={setOpen}
        onSelectView={onSelectView}
        onSelectViewType={onSelectViewType}
      />
    ),
  };
};

