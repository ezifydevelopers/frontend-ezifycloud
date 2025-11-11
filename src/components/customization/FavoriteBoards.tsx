import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, StarOff, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { customizationAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface FavoriteBoard {
  id: string;
  boardId: string;
  position: number;
  board?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    workspaceId: string;
  };
}

interface FavoriteBoardsProps {
  workspaceId?: string;
  onBoardClick?: (boardId: string) => void;
  className?: string;
}

export const FavoriteBoards: React.FC<FavoriteBoardsProps> = ({
  workspaceId,
  onBoardClick,
  className,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorite-boards'],
    queryFn: async () => {
      const response = await customizationAPI.getFavorites();
      return response.data || [];
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (boardId: string) => customizationAPI.removeFavorite(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-boards'] });
      toast({
        title: 'Success',
        description: 'Removed from favorites',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove favorite',
        variant: 'destructive',
      });
    },
  });

  const handleBoardClick = (board: FavoriteBoard) => {
    if (onBoardClick) {
      onBoardClick(board.boardId);
    } else if (board.board?.workspaceId) {
      navigate(`/workspaces/${board.board.workspaceId}/boards/${board.boardId}`);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    removeFavoriteMutation.mutate(boardId);
  };

  if (isLoading) {
    return <div className={cn('text-sm text-muted-foreground', className)}>Loading favorites...</div>;
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No favorite boards yet. Click the star icon on any board to add it to favorites.
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {favorites.map((favorite) => (
        <Card
          key={favorite.id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleBoardClick(favorite)}
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {favorite.board?.icon && (
                <div
                  className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-white text-sm font-semibold"
                  style={{
                    backgroundColor: favorite.board.color || '#6366f1',
                  }}
                >
                  {favorite.board.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{favorite.board?.name || 'Unknown Board'}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={(e) => handleToggleFavorite(e, favorite.boardId)}
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface FavoriteButtonProps {
  boardId: string;
  isFavorite?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  boardId,
  isFavorite: initialIsFavorite,
  onToggle,
  className,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);

  const { data: favorites } = useQuery({
    queryKey: ['favorite-boards'],
    queryFn: async () => {
      const response = await customizationAPI.getFavorites();
      return response.data || [];
    },
  });

  useEffect(() => {
    if (favorites) {
      setIsFavorite(favorites.some(f => f.boardId === boardId));
    }
  }, [favorites, boardId]);

  const addFavoriteMutation = useMutation({
    mutationFn: () => customizationAPI.addFavorite(boardId),
    onSuccess: () => {
      setIsFavorite(true);
      queryClient.invalidateQueries({ queryKey: ['favorite-boards'] });
      toast({
        title: 'Success',
        description: 'Added to favorites',
      });
      onToggle?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add favorite',
        variant: 'destructive',
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: () => customizationAPI.removeFavorite(boardId),
    onSuccess: () => {
      setIsFavorite(false);
      queryClient.invalidateQueries({ queryKey: ['favorite-boards'] });
      toast({
        title: 'Success',
        description: 'Removed from favorites',
      });
      onToggle?.();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove favorite',
        variant: 'destructive',
      });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 w-8 p-0', className)}
      onClick={handleClick}
      disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
    >
      {isFavorite ? (
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ) : (
        <StarOff className="h-4 w-4" />
      )}
    </Button>
  );
};

