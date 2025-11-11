import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Star, MoreVertical, Eye, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { viewAPI, SavedView } from '@/lib/api/viewAPI';
import { ViewType } from '@prisma/client';

interface ViewTabsProps {
  boardId: string;
  currentView: string;
  currentViewId?: string;
  onViewChange: (viewType: string) => void;
  onSavedViewChange: (view: SavedView) => void;
  showDefaultViews?: boolean;
  maxTabs?: number;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({
  boardId,
  currentView,
  currentViewId,
  onViewChange,
  onSavedViewChange,
  showDefaultViews = true,
  maxTabs = 5,
}) => {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [recentViews, setRecentViews] = useState<string[]>([]);
  const [favoriteViews, setFavoriteViews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (boardId) {
      loadViews();
      loadRecentViews();
      loadFavoriteViews();
    }
  }, [boardId]);

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

  const loadFavoriteViews = () => {
    try {
      const favorites = localStorage.getItem(`favorite_views_${boardId}`);
      if (favorites) {
        setFavoriteViews(JSON.parse(favorites));
      }
    } catch (error) {
      console.error('Error loading favorite views:', error);
    }
  };

  const toggleFavorite = async (viewId: string) => {
    try {
      const view = savedViews.find(v => v.id === viewId);
      if (!view) return;

      const settings = (view.settings || {}) as Record<string, unknown>;
      const isFavorite = settings.isFavorite as boolean | undefined || false;

      await viewAPI.updateView(viewId, {
        settings: {
          ...settings,
          isFavorite: !isFavorite,
        },
      });

      await loadViews();
      loadFavoriteViews();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Get views to display as tabs
  const tabsToShow = React.useMemo(() => {
    const tabs: SavedView[] = [];

    // Add default view first
    const defaultView = savedViews.find(v => v.isDefault);
    if (defaultView && showDefaultViews) {
      tabs.push(defaultView);
    }

    // Add favorite views
    favoriteViews.forEach(viewId => {
      const view = savedViews.find(v => v.id === viewId);
      if (view && !tabs.some(t => t.id === view.id)) {
        tabs.push(view);
      }
    });

    // Add recent views (excluding already added)
    recentViews.forEach(viewId => {
      const view = savedViews.find(v => v.id === viewId);
      if (view && !tabs.some(t => t.id === view.id) && tabs.length < maxTabs) {
        tabs.push(view);
      }
    });

    return tabs.slice(0, maxTabs);
  }, [savedViews, favoriteViews, recentViews, maxTabs, showDefaultViews]);

  // Get all other views (not in tabs)
  const otherViews = React.useMemo(() => {
    const tabIds = new Set(tabsToShow.map(t => t.id));
    return savedViews.filter(v => !tabIds.has(v.id));
  }, [savedViews, tabsToShow]);

  const handleViewSelect = (view: SavedView) => {
    // Track usage
    try {
      const recent = recentViews.filter(id => id !== view.id);
      recent.unshift(view.id);
      localStorage.setItem(`recent_views_${boardId}`, JSON.stringify(recent.slice(0, 10)));
      loadRecentViews();
    } catch (error) {
      console.error('Error tracking view usage:', error);
    }

    onSavedViewChange(view);
  };

  // Default view types that should always be available
  const defaultViewTypes = [
    { id: 'table', name: 'Table', type: 'TABLE' },
    { id: 'kanban', name: 'Kanban', type: 'KANBAN' },
    { id: 'calendar', name: 'Calendar', type: 'CALENDAR' },
    { id: 'timeline', name: 'Timeline', type: 'TIMELINE' },
    { id: 'gallery', name: 'Gallery', type: 'GALLERY' },
    { id: 'dashboard', name: 'Dashboard', type: 'DASHBOARD' },
    { id: 'form', name: 'Form', type: 'FORM' },
  ];

  // Always show default views as tabs, and saved views if available
  const defaultViewsAsSaved = defaultViewTypes.map(v => ({
    id: v.id,
    name: v.name,
    type: v.type,
    isDefault: false,
    isShared: false,
    settings: {},
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    boardId: boardId,
  } as SavedView));

  // Combine default views with saved views (default views first)
  const viewsToDisplay = [...defaultViewsAsSaved, ...tabsToShow];

  if (loading) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Tabs value={currentViewId || currentView} className="flex-1">
        <TabsList className="h-auto p-1">
          {viewsToDisplay.map(view => {
            const settings = (view.settings || {}) as Record<string, unknown>;
            const isFavorite = settings.isFavorite as boolean | undefined || false;
            // Check if this is the current view
            const isCurrentView = currentViewId === view.id || 
              (currentView === view.type.toLowerCase() && !currentViewId) ||
              (currentView === view.id && !currentViewId);

            // Check if it's a default view (simple ID without UUID pattern)
            const isDefaultView = !view.id.includes('-') || ['table', 'kanban', 'calendar', 'timeline', 'gallery', 'dashboard', 'form'].includes(view.id);
            
            return (
              <TabsTrigger
                key={view.id}
                value={view.id}
                onClick={() => {
                  if (isDefaultView) {
                    // For default views, just change the view type
                    onViewChange(view.id);
                  } else {
                    // For saved views, use the saved view handler
                    handleViewSelect(view);
                  }
                }}
                className={cn(
                  "relative px-3 py-2 text-sm",
                  isCurrentView && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{view.name}</span>
                  {view.isDefault && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">D</Badge>
                  )}
                  {isFavorite && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Dropdown for more views and default views */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Default Views Section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Default Views
          </div>
          {defaultViewTypes.map(viewType => (
            <DropdownMenuItem
              key={viewType.id}
              onClick={() => onViewChange(viewType.id)}
              className={cn(
                "flex items-center gap-2",
                currentView === viewType.id && "bg-accent"
              )}
            >
              <Eye className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span>{viewType.name}</span>
            </DropdownMenuItem>
          ))}
          
          {/* Saved Views Section */}
          {savedViews.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Saved Views
              </div>
              <DropdownMenuSeparator />
            
            {/* Recent Views */}
            {recentViews.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Recent
                </div>
                {recentViews.slice(0, 5).map(viewId => {
                  const view = savedViews.find(v => v.id === viewId);
                  if (!view) return null;
                  return (
                    <DropdownMenuItem
                      key={view.id}
                      onClick={() => handleViewSelect(view)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{view.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(view.id);
                        }}
                      >
                        <Star
                          className={cn(
                            "h-3 w-3",
                            (view.settings as Record<string, unknown>)?.isFavorite && "text-yellow-500 fill-yellow-500"
                          )}
                        />
                      </Button>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </>
            )}

            {/* All Views */}
            {savedViews.map(view => {
              const settings = (view.settings || {}) as Record<string, unknown>;
              const isFavorite = settings.isFavorite as boolean | undefined || false;
              const isInTabs = tabsToShow.some(t => t.id === view.id);
              
              if (isInTabs) return null;

              return (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => handleViewSelect(view)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Eye className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{view.name}</span>
                    {view.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(view.id);
                    }}
                  >
                    <Star
                      className={cn(
                        "h-3 w-3",
                        isFavorite && "text-yellow-500 fill-yellow-500"
                      )}
                    />
                  </Button>
                </DropdownMenuItem>
              );
            })}
            </>
          )}
          
          {/* Show message if no saved views */}
          {savedViews.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              <p>No saved views yet</p>
              <p className="text-xs mt-1">Use "Views" button to save current view</p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

