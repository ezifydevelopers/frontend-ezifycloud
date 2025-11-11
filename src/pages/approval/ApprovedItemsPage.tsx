// Approved Items Page - View for approved invoices/items

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/layout/PageHeader';
import { FileCheck } from 'lucide-react';
import { approvalAPI, boardAPI } from '@/lib/api';
import { ApprovalStatus } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Filter,
  Search,
  MoreVertical,
  Archive,
  Move,
  Eye,
  RefreshCw,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ApprovedItem {
  id: string;
  name: string;
  boardId: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  approvalStatus: {
    level1: ApprovalStatus | null;
    level2: ApprovalStatus | null;
    level3: ApprovalStatus | null;
    overallStatus: 'pending' | 'approved' | 'rejected' | 'in_progress';
    isFullyApproved: boolean;
    isPartiallyApproved: boolean;
  };
  board?: {
    id: string;
    name: string;
    workspaceId: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Board {
  id: string;
  name: string;
  workspaceId: string;
}

const ApprovedItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { toast } = useToast();
  const [items, setItems] = useState<ApprovedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'fully_approved' | 'partially_approved' | 'archived' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moveDialog, setMoveDialog] = useState<{ item: ApprovedItem; boards: Board[] } | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const fetchApprovedItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getApprovedItems({
        workspaceId,
        filter,
        page,
        limit: 50,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        const data = response as any;
        setItems((data.data as ApprovedItem[]) || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching approved items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approved items',
        variant: 'destructive',
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, filter, page, searchTerm, toast]);

  useEffect(() => {
    fetchApprovedItems();
  }, [fetchApprovedItems]);

  const fetchBoards = async (): Promise<Board[]> => {
    try {
      if (!workspaceId) return [];
      const response = await boardAPI.getBoardsByWorkspace(workspaceId);
      if (response.success && response.data) {
        return (response.data as any[]).map((b: any) => ({
          id: b.id,
          name: b.name,
          workspaceId: b.workspaceId,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching boards:', error);
      return [];
    }
  };

  const handleMove = async (item: ApprovedItem) => {
    const boards = await fetchBoards();
    // Filter out current board
    const availableBoards = boards.filter((b) => b.id !== item.boardId);
    setMoveDialog({ item, boards: availableBoards });
  };

  const handleMoveConfirm = async () => {
    if (!moveDialog || !selectedBoardId) return;

    try {
      setProcessing(true);
      const response = await approvalAPI.moveItemToBoard(moveDialog.item.id, selectedBoardId);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item moved successfully',
        });
        setMoveDialog(null);
        setSelectedBoardId('');
        fetchApprovedItems();
      } else {
        throw new Error('Failed to move item');
      }
    } catch (error: any) {
      console.error('Error moving item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to move item',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleArchive = async (item: ApprovedItem) => {
    if (!item.approvalStatus.isFullyApproved) {
      toast({
        title: 'Error',
        description: 'Only fully approved items can be archived',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to archive "${item.name}"?`)) {
      return;
    }

    try {
      const response = await approvalAPI.archiveItem(item.id);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item archived successfully',
        });
        fetchApprovedItems();
      } else {
        throw new Error('Failed to archive item');
      }
    } catch (error: any) {
      console.error('Error archiving item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive item',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (item: ApprovedItem) => {
    if (!confirm(`Are you sure you want to restore "${item.name}"?`)) {
      return;
    }

    try {
      setProcessing(true);
      const response = await approvalAPI.restoreItem(item.id);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item restored successfully',
        });
        fetchApprovedItems();
      } else {
        throw new Error('Failed to restore item');
      }
    } catch (error: any) {
      console.error('Error restoring item:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to restore item',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (item: ApprovedItem) => {
    // Check if item is archived (we'll need to add this field to the interface)
    const isArchived = filter === 'archived';
    
    if (isArchived) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <Archive className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      );
    } else if (item.approvalStatus.isFullyApproved) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Fully Approved
        </Badge>
      );
    } else if (item.approvalStatus.isPartiallyApproved) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Partially Approved
        </Badge>
      );
    }
    return null;
  };

  const getLevelStatus = (status: ApprovalStatus | null) => {
    if (!status) return '-';
    if (status === 'approved') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Approved</Badge>;
    }
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800 text-xs">Rejected</Badge>;
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approved Items"
        subtitle="View and manage approved invoices and items"
        icon={FileCheck}
        iconColor="from-green-600 to-emerald-600"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Approved Items</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchApprovedItems}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filter}
              onValueChange={(value: any) => {
                setFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approved</SelectItem>
                <SelectItem value="fully_approved">Fully Approved</SelectItem>
                <SelectItem value="partially_approved">Partially Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approved items found
            </div>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Board</TableHead>
                      <TableHead>Level 1</TableHead>
                      <TableHead>Level 2</TableHead>
                      <TableHead>Level 3</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.board?.name || '-'}</TableCell>
                        <TableCell>{getLevelStatus(item.approvalStatus.level1)}</TableCell>
                        <TableCell>{getLevelStatus(item.approvalStatus.level2)}</TableCell>
                        <TableCell>{getLevelStatus(item.approvalStatus.level3)}</TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/workspaces/${item.workspaceId}/boards/${item.boardId}/items/${item.id}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              {filter !== 'archived' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleMove(item)}>
                                    <Move className="h-4 w-4 mr-2" />
                                    Move to Board
                                  </DropdownMenuItem>
                                  {item.approvalStatus.isFullyApproved && (
                                    <DropdownMenuItem
                                      onClick={() => handleArchive(item)}
                                      className="text-red-600"
                                    >
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {filter === 'archived' && (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(item)}
                                  className="text-green-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Move to Board Dialog */}
      <Dialog
        open={!!moveDialog}
        onOpenChange={(open) => {
          if (!open) {
            setMoveDialog(null);
            setSelectedBoardId('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Item to Board</DialogTitle>
            <DialogDescription>
              Select a board to move "{moveDialog?.item.name}" to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Target Board</label>
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  {moveDialog?.boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMoveDialog(null);
                setSelectedBoardId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveConfirm}
              disabled={!selectedBoardId || processing}
            >
              {processing ? 'Moving...' : 'Move Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovedItemsPage;

