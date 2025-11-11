import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, Loader2, FileText, LayoutGrid, Users, Settings } from 'lucide-react';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { aiAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  type: 'item' | 'board' | 'workspace' | 'user';
  title: string;
  subtitle?: string;
  url: string;
  icon?: React.ReactNode;
}

interface GlobalSearchBarProps {
  workspaceId?: string;
  boardId?: string;
  className?: string;
  placeholder?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  workspaceId,
  boardId,
  className,
  placeholder = 'Search items, boards, workspaces...',
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ezify_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Keyboard shortcut to open search
  useKeyboardShortcuts([
    {
      ...commonShortcuts.search,
      action: () => {
        setOpen(true);
      },
    },
  ]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      
      // Use AI smart search if available
      if (boardId || workspaceId) {
        const response = await aiAPI.smartSearch({
          query: searchQuery,
          boardId,
          workspaceId,
          limit: 20,
        });

        if (response.success && response.data?.results) {
          const searchResults: SearchResult[] = response.data.results.map((item: any) => ({
            id: item.id,
            type: 'item' as const,
            title: item.name || item.title || 'Untitled',
            subtitle: item.boardName || item.workspaceName,
            url: `/workspaces/${workspaceId}/boards/${item.boardId}/items/${item.id}`,
            icon: <FileText className="h-4 w-4" />,
          }));
          setResults(searchResults);
        }
      } else {
        // Basic search fallback - search in current context
        // This would need to be implemented based on your API
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to perform search',
        variant: 'destructive',
      });
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [boardId, workspaceId, toast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && query) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open, performSearch]);

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem('ezify_recent_searches', JSON.stringify(updated));
    }

    navigate(result.url);
    setOpen(false);
    setQuery('');
  };

  const handleRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery);
  };

  return (
    <>
      <div className={cn('relative flex items-center', className)}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 h-6 w-6 p-0"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <span className="text-xs">×</span>
          </Button>
        )}
        <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden md:flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {searching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!searching && query && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!searching && !query && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((recent, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => handleRecentSearch(recent)}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  {recent}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!searching && results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-2"
                >
                  {result.icon || <FileText className="h-4 w-4" />}
                  <div className="flex flex-col flex-1">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!searching && !query && (
            <CommandGroup heading="Quick Actions">
              <CommandItem
                onSelect={() => {
                  navigate('/workspaces');
                  setOpen(false);
                }}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Go to Workspaces
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/workspaces');
                  setOpen(false);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Go to Teams
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

