import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BoardCard } from '@/components/board/BoardCard';
import { CreateBoardDialog } from '@/components/board/CreateBoardDialog';
import PageHeader from '@/components/layout/PageHeader';
import { boardAPI } from '@/lib/api';
import { Board } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import {
  Grid3x3,
  Plus,
  Search,
  RefreshCw,
  Frown,
} from 'lucide-react';

const BoardListPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<{ board: Board; itemCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBoards = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setIsRefreshing(true);
      const response = await boardAPI.getWorkspaceBoards(workspaceId, {
        page: 1,
        limit: 100,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        const boardsData = (response.data as any).data || [];
        setBoards(boardsData as Board[]);
      } else {
        setBoards([]);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch boards',
        variant: 'destructive',
      });
      setBoards([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [workspaceId, searchTerm, toast]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateSuccess = () => {
    fetchBoards();
  };

  const handleEdit = (board: Board) => {
    // TODO: Implement edit board functionality
    toast({
      title: 'Coming Soon',
      description: 'Edit board functionality will be available soon',
    });
  };

  const handleDelete = (board: Board) => {
    const itemCount = (board as any)._count?.items ?? 0;
    setBoardToDelete({ board, itemCount });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!boardToDelete) return;
    try {
      setDeleting(true);
      const response = await boardAPI.deleteBoard(boardToDelete.board.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Board deleted successfully',
        });
        fetchBoards();
        setDeleteDialogOpen(false);
        setBoardToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete board');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete board',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async (board: Board) => {
    try {
      const response = await boardAPI.updateBoard(board.id, {
        isArchived: !board.isArchived,
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: board.isArchived ? 'Board unarchived successfully' : 'Board archived successfully',
        });
        fetchBoards();
      } else {
        throw new Error(response.message || 'Failed to update board');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update board',
        variant: 'destructive',
      });
    }
  };

  const filteredBoards = boards.filter(board =>
    searchTerm === '' ||
    board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Boards"
          subtitle="Manage your boards and organize your work"
          icon={Grid3x3}
          iconColor="from-blue-600 to-purple-600"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search boards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button
              onClick={() => {
                setIsRefreshing(true);
                fetchBoards();
              }}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="bg-white/50 border-white/20 hover:bg-white/80"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Board
            </Button>
          </div>
        </PageHeader>

        {/* Boards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBoards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4">
                <Frown className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchTerm ? 'No boards found' : 'No boards yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first board to get started'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Board
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Board Dialog */}
        {workspaceId && (
          <CreateBoardDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            workspaceId={workspaceId}
            onSuccess={handleCreateSuccess}
          />
        )}

        {/* Delete Board Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setBoardToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Board"
          description={
            boardToDelete
              ? `Are you sure you want to delete "${boardToDelete.board.name}"? This action cannot be undone.${boardToDelete.itemCount > 0 ? ` ${boardToDelete.itemCount} item${boardToDelete.itemCount === 1 ? '' : 's'} will also be deleted.` : ''}`
              : ''
          }
          confirmText={`Delete Board${boardToDelete && boardToDelete.itemCount > 0 ? ` (${boardToDelete.itemCount} item${boardToDelete.itemCount === 1 ? '' : 's'})` : ''}`}
          cancelText="Cancel"
          variant="destructive"
          loading={deleting}
        />
      </div>
    </div>
  );
};

export default BoardListPage;

