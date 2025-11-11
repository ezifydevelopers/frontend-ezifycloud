import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Sparkles,
  Loader2,
  TrendingUp,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SmartSearchProps {
  boardId?: string;
  workspaceId?: string;
  onItemClick?: (itemId: string) => void;
  className?: string;
}

interface SearchResult {
  itemId: string;
  itemName: string;
  relevanceScore: number;
  matchedFields: string[];
  snippet?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  boardId,
  workspaceId,
  onItemClick,
  className,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [queryInterpretation, setQueryInterpretation] = useState<string>();
  const [open, setOpen] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }

    try {
      setSearching(true);
      const response = await aiAPI.smartSearch({
        query: query.trim(),
        boardId,
        workspaceId,
        limit: 10,
      });

      if (response.success && response.data) {
        setResults(response.data.results || []);
        setQueryInterpretation(response.data.queryInterpretation);
        
        if (!response.data.results || response.data.results.length === 0) {
          toast({
            title: 'No Results',
            description: 'No items found matching your query',
          });
        }
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Search failed',
        variant: 'destructive',
      });
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, boardId, workspaceId, toast]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !searching) {
      handleSearch();
    }
  };

  const handleItemClick = (itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    } else {
      navigate(`/items/${itemId}`);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative flex items-center', className)}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search with natural language... (e.g., 'unpaid invoices over $5000')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setOpen(true)}
            className="pl-10 pr-10 w-full"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 h-6 w-6 p-0"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Smart Search</span>
          </div>
          {queryInterpretation && (
            <p className="text-xs text-muted-foreground italic">
              "{queryInterpretation}"
            </p>
          )}
        </div>

        {searching && (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-600 mb-4" />
            <p className="text-sm text-muted-foreground">Searching...</p>
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No results found</p>
            <p className="text-xs mt-2">Try a different query or refine your search</p>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="max-h-[400px] overflow-y-auto">
            {results.map((result, index) => (
              <Card
                key={result.itemId}
                className={cn(
                  'm-2 cursor-pointer transition-colors hover:bg-slate-50',
                  index === 0 && 'border-purple-200 bg-purple-50/50'
                )}
                onClick={() => handleItemClick(result.itemId)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-sm truncate">{result.itemName}</p>
                      </div>
                      {result.matchedFields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.matchedFields.slice(0, 3).map((field, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={index === 0 ? 'default' : 'secondary'}
                        className={cn(
                          index === 0 && 'bg-purple-100 text-purple-800'
                        )}
                      >
                        {Math.round(result.relevanceScore * 100)}%
                      </Badge>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Best Match
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!query && !searching && (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium mb-2">Smart Search</p>
            <p className="text-xs">Try queries like:</p>
            <ul className="text-xs mt-2 space-y-1">
              <li>"Show unpaid invoices from last month"</li>
              <li>"Invoices over $5000 pending approval"</li>
              <li>"Items created this week"</li>
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

