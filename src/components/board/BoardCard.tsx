import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Archive,
  Globe,
  Lock,
  MoreVertical,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Board, BoardType } from '@/types/workspace';

interface BoardCardProps {
  board: Board;
  onEdit?: (board: Board) => void;
  onDelete?: (board: Board) => void;
  onArchive?: (board: Board) => void;
}

export const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const navigate = useNavigate();

  const getBoardTypeIcon = (type: BoardType) => {
    switch (type) {
      case 'invoices':
        return '📄';
      case 'payments':
        return '💰';
      case 'clients':
        return '👥';
      default:
        return '📋';
    }
  };

  const getBoardTypeColor = (type: BoardType) => {
    switch (type) {
      case 'invoices':
        return 'from-blue-500 to-cyan-600';
      case 'payments':
        return 'from-green-500 to-emerald-600';
      case 'clients':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-slate-500 to-gray-600';
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${getBoardTypeColor(board.type)} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${getBoardTypeColor(board.type)} shadow-lg`}>
              <span className="text-2xl">{getBoardTypeIcon(board.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                {board.name}
              </h3>
              {board.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {board.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {board.type.charAt(0).toUpperCase() + board.type.slice(1)}
                </Badge>
                {board.isPublic ? (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
                {board.isArchived && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    <Archive className="h-3 w-3 mr-1" />
                    Archived
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/workspaces/${board.workspaceId}/boards/${board.id}`)}>
                <FileText className="h-4 w-4 mr-2" />
                View Board
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(board)}>
                  Edit Board
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(board)}>
                  {board.isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(board)}
                  className="text-red-600"
                >
                  Delete Board
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{board._count?.items || 0} items</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>•</span>
              <span>{board._count?.columns || 0} columns</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/workspaces/${board.workspaceId}/boards/${board.id}`)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            View
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

