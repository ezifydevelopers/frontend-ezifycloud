import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/layout/PageHeader';
import { boardAPI } from '@/lib/api';
import { Item, Column, ColumnType } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Calendar,
  User,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ItemCommentsDialog } from '@/components/board/ItemCommentsDialog';
import { ItemFilesDialog } from '@/components/board/ItemFilesDialog';
import { ItemApprovalDialog } from '@/components/board/ItemApprovalDialog';
import { ApprovalStatusBadge } from '@/components/board/ApprovalStatusBadge';
import { RejectedItemBanner } from '@/components/board/RejectedItemBanner';
import { ChangesRequestedBanner } from '@/components/board/ChangesRequestedBanner';
import { ApprovalStatusIndicator } from '@/components/board/ApprovalStatusIndicator';
import { ApprovalHistory } from '@/components/board/ApprovalHistory';
import { StatusManagement } from '@/components/board/StatusManagement';
import { ActivityLog } from '@/components/board/ActivityLog';
import { ItemAssignments } from '@/components/board/ItemAssignments';
import { CellRenderer } from '@/components/board/table/CellRenderer/CellRenderer';
import { CommentList } from '@/components/board/CommentList';
import { FileGallery } from '@/components/board/FileGallery';
import { ApprovalTimeline } from '@/components/board/ApprovalTimeline';
import { useItemApprovals } from '@/components/board/table/hooks/useItemApprovals';
import { workspaceAPI } from '@/lib/api';
import { getCellValue } from '@/components/board/table/utils/tableUtils';

const ItemDetailPage: React.FC = () => {
  const { workspaceId, boardId, itemId } = useParams<{ workspaceId: string; boardId: string; itemId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);
  const { itemApprovals, fetchItemApproval } = useItemApprovals();

  const fetchItem = useCallback(async () => {
    if (!boardId || !itemId) return;

    try {
      setLoading(true);
      const [itemsResponse, columnsResponse] = await Promise.all([
        boardAPI.getBoardItems(boardId, { page: 1, limit: 1000 }),
        boardAPI.getBoardColumns(boardId),
      ]);

      if (itemsResponse.success && itemsResponse.data) {
        const itemsData = (itemsResponse.data as any).data || [];
        const foundItem = itemsData.find((i: Item) => i.id === itemId);
        setItem(foundItem || null);
      }

      if (columnsResponse.success && columnsResponse.data) {
        const columnsData = (columnsResponse.data as Column[]) || [];
        setColumns(columnsData.filter(col => !col.isHidden).sort((a, b) => a.position - b.position));
      }

      // Fetch approval status
      if (itemId) {
        fetchItemApproval(itemId);
      }

      // Fetch workspace members for people columns
      if (workspaceId) {
        try {
          const membersResponse = await workspaceAPI.getWorkspaceMembers(workspaceId);
          if (membersResponse.success && membersResponse.data) {
            const membersData = Array.isArray(membersResponse.data) ? membersResponse.data : [];
            const formattedMembers = membersData.map((member: any) => ({
              id: member.userId || (member.user?.id || ''),
              name: member.user?.name || member.email || 'Unknown',
              email: member.user?.email || member.email || '',
              profilePicture: member.user?.profilePicture,
            }));
            setWorkspaceMembers(formattedMembers);
          }
        } catch (error) {
          console.error('Error fetching workspace members:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      toast({
        title: 'Error',
        description: 'Failed to load item details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [boardId, itemId, workspaceId, toast, fetchItemApproval]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleDelete = async () => {
    if (!item || !confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await boardAPI.deleteItem(item.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Item deleted successfully',
        });
        navigate(`/workspaces/${workspaceId}/boards/${boardId}`);
      } else {
        throw new Error(response.message || 'Failed to delete item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const renderCellValue = (column: Column): React.ReactNode => {
    if (!item) return <span className="text-muted-foreground">—</span>;
    
    const value = getCellValue(item, column.id);
    
    // Use CellRenderer for proper formatting of all column types
    return (
      <div className="py-1">
        <CellRenderer
          item={item}
          column={column}
          value={value}
          onClick={() => {
            // Navigate to edit mode or open edit dialog
            navigate(`/workspaces/${workspaceId}/boards/${boardId}?edit=${item.id}`);
          }}
          workspaceMembers={workspaceMembers}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">Item not found</p>
              <Button onClick={() => navigate(`/workspaces/${workspaceId}/boards/${boardId}`)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Board
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <PageHeader
          title={item.name}
          subtitle={`Item details and information`}
          icon={Edit}
          iconColor="from-blue-600 to-purple-600"
        >
          <div className="flex items-center gap-2">
            {/* Approval Status Badge */}
            {itemApprovals[itemId] && (
              <ApprovalStatusBadge
                status={itemApprovals[itemId].overallStatus}
                size="md"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCommentsDialogOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilesDialogOpen(true);
              }}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Files
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setApprovalDialogOpen(true);
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approvals
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/workspaces/${workspaceId}/boards/${boardId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Changes Requested Banner - Show if changes requested */}
            {itemApprovals[itemId] && (
              <ChangesRequestedBanner
                approvalStatus={itemApprovals[itemId]}
                itemId={itemId}
                itemName={item.name}
                onEdit={() => {
                  // Item is already editable on this page
                }}
                onResubmitted={() => {
                  fetchItemApproval(itemId);
                }}
              />
            )}

            {/* Rejected Item Banner - Show prominently if rejected (but not changes requested) */}
            {itemApprovals[itemId]?.overallStatus === 'rejected' &&
              !itemApprovals[itemId]?.level1?.comments?.includes('Changes requested:') &&
              !itemApprovals[itemId]?.level2?.comments?.includes('Changes requested:') &&
              !itemApprovals[itemId]?.level3?.comments?.includes('Changes requested:') && (
              <RejectedItemBanner
                approvalStatus={itemApprovals[itemId]}
                itemName={item.name}
                onEdit={() => {
                  // Trigger edit - could open edit dialog or navigate
                  // For now, item is already editable via inline editing
                }}
                onResubmit={async () => {
                  try {
                    const response = await approvalAPI.requestApproval(itemId, { levels: ['LEVEL_1'] });
                    if (response.success) {
                      fetchItemApproval(itemId);
                    }
                  } catch (error) {
                    console.error('Error resubmitting:', error);
                  }
                }}
              />
            )}

            {/* Approval Status Card - Prominently Displayed */}
            {itemApprovals[itemId] && (
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    Approval Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Overall Status:</span>
                      <ApprovalStatusBadge
                        status={itemApprovals[itemId].overallStatus}
                        size="lg"
                      />
                    </div>
                    
                    {/* Visual Approval Flow Indicator */}
                    <div className="pb-4 border-b">
                      <ApprovalStatusIndicator
                        approvalStatus={itemApprovals[itemId]}
                        variant="detailed"
                        showApprover={true}
                        showDate={true}
                      />
                    </div>

                    <ApprovalTimeline
                      approvalStatus={itemApprovals[itemId]}
                      showDetails={true}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval History - Complete timeline */}
            {itemApprovals[itemId] && (
              <ApprovalHistory itemId={itemId} itemName={item.name} />
            )}

            {/* Item Details */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {columns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No columns defined for this item</p>
                  </div>
                ) : (
                  columns.map((column) => (
                    <div key={column.id} className="border-b pb-4 last:border-0">
                      <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        {column.name}
                        {column.required && <span className="text-destructive ml-1">*</span>}
                        <Badge variant="outline" className="text-xs">
                          {column.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="text-base">{renderCellValue(column)}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Files Section */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Files
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilesDialogOpen(true)}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FileGallery itemId={itemId} itemName={item.name} />
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentsDialogOpen(true)}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CommentList itemId={itemId} />
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <ActivityLog
              itemId={itemId}
              boardId={boardId}
              workspaceId={workspaceId}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="font-medium">{item.creator?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{format(new Date(item.createdAt), 'PPp')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{format(new Date(item.updatedAt), 'PPp')}</span>
                </div>
                <div className="pt-2 border-t">
                  <Label className="text-sm text-muted-foreground mb-2 block">Status:</Label>
                  <StatusManagement
                    item={item}
                    itemStatus={item.status}
                    statusColumn={columns.find(col => col.type === 'STATUS' && !col.isHidden)}
                    onStatusChange={fetchItem}
                    variant="badge"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignments */}
            <ItemAssignments
              itemId={itemId}
              boardId={boardId}
              workspaceId={workspaceId}
              columnId={columns.find(col => col.type === 'PEOPLE' && !col.isHidden)?.id}
              onUpdate={fetchItem}
            />

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Trigger edit from parent
                    navigate(`/workspaces/${workspaceId}/boards/${boardId}?edit=${item.id}`);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialogs */}
        {itemId && (
          <>
            <ItemCommentsDialog
              open={commentsDialogOpen}
              onOpenChange={setCommentsDialogOpen}
              itemId={itemId}
              itemName={item.name}
              workspaceId={workspaceId}
            />
            <ItemFilesDialog
              open={filesDialogOpen}
              onOpenChange={setFilesDialogOpen}
              itemId={itemId}
              itemName={item.name}
            />
            <ItemApprovalDialog
              open={approvalDialogOpen}
              onOpenChange={setApprovalDialogOpen}
              itemId={itemId}
              itemName={item.name}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ItemDetailPage;

