import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PageHeader from '@/components/layout/PageHeader';
import { workspaceAPI, boardAPI } from '@/lib/api';
import { Workspace, WorkspaceMember, WorkspaceRole, Board } from '@/types/workspace';
import { BoardCard } from '@/components/board/BoardCard';
import { CreateBoardDialog } from '@/components/board/CreateBoardDialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import {
  Building2,
  Users,
  FileText,
  Settings,
  Plus,
  RefreshCw,
  Mail,
  Crown,
  Shield,
  DollarSign,
  User,
  Eye,
  MoreVertical,
  FileCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const WorkspaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRole, setUserRole] = useState<WorkspaceRole | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [boardViewMode, setBoardViewMode] = useState<'grid' | 'list'>(() => {
    try {
      const saved = localStorage.getItem('boards_view_mode');
      return (saved as 'grid' | 'list') || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [boardSortBy, setBoardSortBy] = useState<'name' | 'updatedAt' | 'createdAt'>('updatedAt');
  const [boardSortOrder, setBoardSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<{ board: Board; itemCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [workspaceResponse, membersResponse, boardsResponse] = await Promise.all([
        workspaceAPI.getWorkspaceById(id),
        workspaceAPI.getWorkspaceMembers(id),
        boardAPI.getWorkspaceBoards(id, { limit: 100, sortBy: boardSortBy, sortOrder: boardSortOrder }),
      ]);

      if (workspaceResponse.success && workspaceResponse.data) {
        const ws = workspaceResponse.data as any;
        setWorkspace(ws as Workspace);
        
        // Get user role from members
        const currentUserRole = ws.members?.find((m: any) => m.userId === user?.id)?.role;
        setUserRole(currentUserRole || null);
      }

      if (membersResponse.success && membersResponse.data) {
        setMembers(membersResponse.data as WorkspaceMember[]);
      }

      if (boardsResponse.success && boardsResponse.data) {
        const boardsData = (boardsResponse.data as any).boards || (boardsResponse.data as any).data || [];
        setBoards(boardsData as Board[]);
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch workspace details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast, boardSortBy, boardSortOrder]);

  useEffect(() => {
    try { localStorage.setItem('boards_view_mode', boardViewMode); } catch {}
  }, [boardViewMode]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const getRoleIcon = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'finance':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'finance':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'member':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Workspace not found</h3>
            <p className="text-muted-foreground mb-4">The workspace you're looking for doesn't exist or you don't have access.</p>
            <Button onClick={() => navigate('/workspaces')} variant="outline">
              Back to Workspaces
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title={workspace.name}
            subtitle={workspace.description || 'Workspace overview and management'}
            icon={Building2}
            iconColor="from-blue-600 to-purple-600"
          >
            <div className="flex items-center space-x-3">
              {(userRole === 'owner' || userRole === 'admin') && (
                <>
                  <Button
                    onClick={() => navigate(`/workspaces/${id}/boards/new`)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Board
                  </Button>
                  <Button
                    onClick={() => navigate(`/workspaces/${id}/settings`)}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </>
              )}
              <Button
                onClick={fetchWorkspace}
                variant="outline"
                size="sm"
                className="bg-white/50 border-white/20 hover:bg-white/80"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </PageHeader>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Members</p>
                    <p className="text-2xl font-bold text-slate-900">{workspace._count?.members || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Boards</p>
                    <p className="text-2xl font-bold text-slate-900">{workspace._count?.boards || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Your Role</p>
                    <p className="text-2xl font-bold text-slate-900 capitalize">{userRole || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-1 shadow-lg">
              <TabsTrigger 
                value="overview"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="boards"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                Boards
              </TabsTrigger>
              <TabsTrigger 
                value="members"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                Members
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workspace Info */}
                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle>Workspace Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="text-base font-semibold text-slate-900">{workspace.name}</p>
                    </div>
                    {workspace.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="text-base text-slate-700">{workspace.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Slug</p>
                      <p className="text-base text-slate-700 font-mono">{workspace.slug}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                      <p className="text-base text-slate-700">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Board
                    </Button>
                    <Button
                      onClick={() => navigate(`/workspaces/${id}/approved-items`)}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Approved Items
                    </Button>
                    {(userRole === 'owner' || userRole === 'admin') && (
                      <>
                        <Button
                          onClick={() => navigate(`/workspaces/${id}/members/invite`)}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Invite Members
                        </Button>
                        <Button
                          onClick={() => navigate(`/workspaces/${id}/settings`)}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Workspace Settings
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Boards Tab */}
            <TabsContent value="boards" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Boards</h3>
                  <p className="text-sm text-muted-foreground">
                    {boards.length} board{boards.length !== 1 ? 's' : ''} in this workspace
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      className={`px-2 py-1 text-sm ${boardViewMode === 'grid' ? 'bg-slate-200' : ''}`}
                      onClick={() => setBoardViewMode('grid')}
                      title="Grid view"
                    >
                      Grid
                    </button>
                    <button
                      className={`px-2 py-1 text-sm ${boardViewMode === 'list' ? 'bg-slate-200' : ''}`}
                      onClick={() => setBoardViewMode('list')}
                      title="List view"
                    >
                      List
                    </button>
                  </div>
                  <select
                    value={boardSortBy}
                    onChange={(e) => setBoardSortBy(e.target.value as any)}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="updatedAt">Last modified</option>
                    <option value="createdAt">Created date</option>
                  </select>
                  <select
                    value={boardSortOrder}
                    onChange={(e) => setBoardSortOrder(e.target.value as any)}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                {(userRole === 'owner' || userRole === 'admin' || userRole === 'finance' || userRole === 'member') && (
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Board
                  </Button>
                )}
                </div>
              </div>

              {boards.length > 0 ? (
                boardViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map((board: Board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        onEdit={(board) => {
                          navigate(`/workspaces/${id}/boards/${board.id}`);
                        }}
                      onDelete={(board) => {
                        const itemCount = (board as any)._count?.items ?? 0;
                        setBoardToDelete({ board, itemCount });
                        setDeleteDialogOpen(true);
                      }}
                        onArchive={async (board) => {
                          try {
                            await boardAPI.updateBoard(board.id, { isArchived: !board.isArchived });
                            toast({ title: 'Success', description: board.isArchived ? 'Board unarchived' : 'Board archived' });
                            fetchWorkspace();
                          } catch (error) {
                            toast({ title: 'Error', description: 'Failed to update board', variant: 'destructive' });
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm font-semibold text-slate-600 border-b">
                      <div className="col-span-5">Name</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Items</div>
                      <div className="col-span-3">Last updated</div>
                    </div>
                    <div>
                      {boards.map((board: Board) => (
                        <div key={board.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-slate-50 border-b last:border-b-0 cursor-pointer" onClick={() => navigate(`/workspaces/${id}/boards/${board.id}`)}>
                          <div className="col-span-5 font-medium text-slate-900">{board.name}</div>
                          <div className="col-span-2 capitalize">{board.type}</div>
                          <div className="col-span-2">{(board as any)._count?.items ?? 0}</div>
                          <div className="col-span-3 text-slate-600">{new Date(board.updatedAt as unknown as string).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No boards yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first board to start managing invoices</p>
                    {(userRole === 'owner' || userRole === 'admin' || userRole === 'finance' || userRole === 'member') && (
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
            </TabsContent>
            
            {/* Create Board Dialog */}
            {id && (
              <CreateBoardDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                workspaceId={id}
                onSuccess={fetchWorkspace}
              />
            )}

            {/* Delete Board Confirmation Dialog */}
            <ConfirmationDialog
              isOpen={deleteDialogOpen}
              onClose={() => {
                setDeleteDialogOpen(false);
                setBoardToDelete(null);
              }}
              onConfirm={async () => {
                if (!boardToDelete) return;
                try {
                  setDeleting(true);
                  await boardAPI.deleteBoard(boardToDelete.board.id);
                  toast({ title: 'Success', description: 'Board deleted successfully' });
                  fetchWorkspace();
                  setDeleteDialogOpen(false);
                  setBoardToDelete(null);
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to delete board', variant: 'destructive' });
                } finally {
                  setDeleting(false);
                }
              }}
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

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
                  <p className="text-sm text-muted-foreground">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {(userRole === 'owner' || userRole === 'admin') && (
                  <Button
                    onClick={() => navigate(`/workspaces/${id}/members/invite`)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>

              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-200">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                              {member.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">{member.user?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground flex items-center space-x-2">
                              <Mail className="h-3 w-3" />
                              <span>{member.user?.email || 'No email'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={`${getRoleColor(member.role)}`}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1 capitalize">{member.role}</span>
                          </Badge>
                          {(userRole === 'owner' || userRole === 'admin') && member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                            {userRole === 'owner' && member.role !== 'owner' && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (!id) return;
                                  const confirmed = confirm(`Transfer workspace ownership to ${member.user?.name || member.user?.email}? You will become an admin.`);
                                  if (!confirmed) return;
                                  try {
                                    const res = await workspaceAPI.transferOwnership(id, member.userId);
                                    if (res.success) {
                                      toast({ title: 'Ownership transferred' });
                                      fetchWorkspace();
                                    } else {
                                      throw new Error(res.message || 'Failed to transfer ownership');
                                    }
                                  } catch (e) {
                                    toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to transfer ownership', variant: 'destructive' });
                                  }
                                }}
                                className="text-orange-600"
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Transfer Ownership
                              </DropdownMenuItem>
                            )}
                                <DropdownMenuItem className="text-red-600">
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetailPage;

