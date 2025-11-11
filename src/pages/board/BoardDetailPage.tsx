import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BoardTableView } from '@/components/board/BoardTableView';
import { BoardKanbanView } from '@/components/board/BoardKanbanView';
import { BoardCalendarView } from '@/components/board/BoardCalendarView';
import { BoardTimelineView } from '@/components/board/BoardTimelineView';
import { BoardGalleryView } from '@/components/board/BoardGalleryView';
import { BoardDashboardView } from '@/components/board/BoardDashboardView';
import { BoardFormView } from '@/components/board/BoardFormView';
import { CreateItemDialog } from '@/components/board/CreateItemDialog';
import { CreateColumnDialog } from '@/components/board/CreateColumnDialog';
import { DeleteColumnDialog } from '@/components/board/column-form/DeleteColumnDialog';
import { ViewManagement } from '@/components/board/ViewManagement';
import { ViewQuickSwitcher, useViewQuickSwitcher } from '@/components/board/ViewQuickSwitcher';
import { ViewTabs } from '@/components/board/ViewTabs';
import { AutomationManagement } from '@/components/board/AutomationManagement';
import { AIInsights } from '@/components/ai/AIInsights';
import { ApprovalWorkflowSetup } from '@/components/board/ApprovalWorkflowSetup';
import { TrashView } from '@/components/board/TrashView';
import { ArchiveView } from '@/components/board/ArchiveView';
import { InvoiceNumberingSettings } from '@/components/board/InvoiceNumberingSettings';
import { BoardHeader } from '@/components/board/BoardHeader';
import { boardAPI, viewAPI, SavedView } from '@/lib/api';
import { Board, Item, Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  Columns,
  Plus,
  Layout,
  Calendar,
  GanttChart,
  Image,
  BarChart3,
  FileText,
  Zap,
  Trash2,
  Archive,
  Settings,
} from 'lucide-react';

const BoardDetailPage: React.FC = () => {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('table');
  const [activeViewId, setActiveViewId] = useState<string | undefined>();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [deleteColumnDialogOpen, setDeleteColumnDialogOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<Column | null>(null);
  const [invoiceSettingsOpen, setInvoiceSettingsOpen] = useState(false);
  const [invoiceSettingsColumn, setInvoiceSettingsColumn] = useState<Column | null>(null);

  // Quick switcher hook
  const quickSwitcher = useViewQuickSwitcher(
    boardId!,
    activeTab,
    (view: SavedView) => {
      setActiveTab(view.type.toLowerCase());
      setActiveViewId(view.id);
      toast({
        title: 'View Switched',
        description: `Switched to ${view.name}`,
      });
    },
    (viewType: string) => {
      setActiveTab(viewType);
      setActiveViewId(undefined);
      toast({
        title: 'View Switched',
        description: `Switched to ${viewType} view`,
      });
    }
  );

  const fetchBoard = useCallback(async () => {
    if (!boardId) return;

    try {
      setLoading(true);
      const response = await boardAPI.getBoardById(boardId);

      if (response.success && response.data) {
        const boardData = response.data as any;
        setBoard(boardData as Board);
        if (boardData.columns) {
          setColumns(boardData.columns as Column[]);
        }
      }
    } catch (error) {
      console.error('Error fetching board:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch board details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  const fetchColumns = useCallback(async () => {
    if (!boardId) return;

    try {
      const response = await boardAPI.getBoardColumns(boardId);
      if (response.success && response.data) {
        const columnsData = (response.data as any[]) || [];
        setColumns(columnsData as Column[]);
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
    fetchColumns();
  }, [boardId, fetchBoard, fetchColumns]);

  const handleItemCreate = () => {
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const handleItemEdit = (item: Item) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleItemDialogSuccess = () => {
    setItemDialogOpen(false);
    setEditingItem(null);
    fetchBoard();
  };

  const handleItemDelete = (item: Item) => {
    // Handled in BoardTableView
    fetchBoard();
  };

  const handleColumnCreate = () => {
    setEditingColumn(null);
    setColumnDialogOpen(true);
  };

  const handleColumnEdit = (column: Column) => {
    setEditingColumn(column);
    setColumnDialogOpen(true);
  };

  const handleColumnDialogSuccess = () => {
    setColumnDialogOpen(false);
    setEditingColumn(null);
    fetchColumns();
  };

  const handleColumnDelete = (column: Column) => {
    setColumnToDelete(column);
    setDeleteColumnDialogOpen(true);
  };

  const handleDeleteColumnSuccess = () => {
    setDeleteColumnDialogOpen(false);
    setColumnToDelete(null);
    fetchColumns();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Board not found</p>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Board Header */}
      <BoardHeader
        board={board}
        workspaceId={workspaceId!}
        boardId={boardId!}
        activeTab={activeTab}
        activeViewId={activeViewId}
        columns={columns.map(col => ({ id: col.id, name: col.name }))}
        onViewChange={(viewType) => {
          setActiveTab(viewType);
          setActiveViewId(undefined);
        }}
        onSavedViewChange={(view) => {
          setActiveTab(view.type.toLowerCase());
          setActiveViewId(view.id);
          toast({
            title: 'View Switched',
            description: `Switched to ${view.name}`,
          });
        }}
        onBackToWorkspace={() => navigate(`/workspaces/${workspaceId}`)}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setActiveViewId(undefined);
        }} className="h-full">
          <TabsList className="hidden">
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="automations">Automations</TabsTrigger>
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="trash">Trash</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="h-full m-0">
            <BoardTableView
              boardId={boardId!}
              workspaceId={workspaceId!}
              columns={columns}
              onItemCreate={handleItemCreate}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onColumnsChange={fetchColumns}
            />
            <CreateItemDialog
              open={itemDialogOpen}
              onOpenChange={setItemDialogOpen}
              boardId={boardId!}
              columns={columns}
              item={editingItem}
              onSuccess={handleItemDialogSuccess}
            />
          </TabsContent>

          <TabsContent value="kanban" className="h-full m-0 p-6">
            <BoardKanbanView
              boardId={boardId!}
              columns={columns}
              onItemCreate={handleItemCreate}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onColumnsChange={fetchColumns}
            />
            <CreateItemDialog
              open={itemDialogOpen}
              onOpenChange={setItemDialogOpen}
              boardId={boardId!}
              columns={columns}
              item={editingItem}
              onSuccess={handleItemDialogSuccess}
            />
          </TabsContent>

          <TabsContent value="calendar" className="h-full m-0 p-6">
            <BoardCalendarView
              boardId={boardId!}
              columns={columns}
              onItemCreate={handleItemCreate}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onColumnsChange={fetchColumns}
            />
            <CreateItemDialog
              open={itemDialogOpen}
              onOpenChange={setItemDialogOpen}
              boardId={boardId!}
              columns={columns}
              item={editingItem}
              onSuccess={handleItemDialogSuccess}
            />
          </TabsContent>

          <TabsContent value="timeline" className="h-full m-0 p-6">
            <BoardTimelineView
              boardId={boardId!}
              columns={columns}
              onItemCreate={handleItemCreate}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onColumnsChange={fetchColumns}
            />
            <CreateItemDialog
              open={itemDialogOpen}
              onOpenChange={setItemDialogOpen}
              boardId={boardId!}
              columns={columns}
              item={editingItem}
              onSuccess={handleItemDialogSuccess}
            />
          </TabsContent>

          <TabsContent value="gallery" className="h-full m-0 p-6">
            <BoardGalleryView
              boardId={boardId!}
              columns={columns}
              onItemCreate={handleItemCreate}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onColumnsChange={fetchColumns}
            />
            <CreateItemDialog
              open={itemDialogOpen}
              onOpenChange={setItemDialogOpen}
              boardId={boardId!}
              columns={columns}
              item={editingItem}
              onSuccess={handleItemDialogSuccess}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="h-full m-0 p-6">
            <div className="space-y-6">
              <AIInsights
                boardId={boardId!}
                workspaceId={workspaceId!}
                type="board_summary"
                inline
              />
              <BoardDashboardView
                boardId={boardId!}
                columns={columns}
                onItemCreate={handleItemCreate}
                onItemEdit={handleItemEdit}
                onItemDelete={handleItemDelete}
                onColumnsChange={fetchColumns}
              />
            </div>
          </TabsContent>

          <TabsContent value="form" className="h-full m-0 p-6">
            <BoardFormView
              boardId={boardId!}
              columns={columns}
              board={board}
              onItemCreate={handleItemDialogSuccess}
              onItemEdit={handleItemEdit}
              onItemDelete={handleItemDelete}
              onColumnsChange={fetchColumns}
            />
          </TabsContent>

          <TabsContent value="automations" className="h-full m-0 p-6">
            <AutomationManagement
              boardId={boardId!}
              columns={columns.map(col => ({
                id: col.id,
                name: col.name,
                type: col.type,
                isHidden: col.isHidden,
              }))}
              onAutomationChange={fetchBoard}
            />
          </TabsContent>

          <TabsContent value="columns" className="h-full m-0 p-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Board Columns</CardTitle>
                  <Button onClick={handleColumnCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {columns.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No columns defined yet.</p>
                    <Button onClick={handleColumnCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Column
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {columns
                      .filter(col => !col.isHidden)
                      .sort((a, b) => a.position - b.position)
                      .map((column) => (
                        <Card key={column.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{column.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Type: {column.type} • Required: {column.required ? 'Yes' : 'No'} • 
                                Width: {column.width || 200}px • Position: {column.position}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{column.type}</Badge>
                              {column.isHidden && (
                                <Badge variant="secondary">Hidden</Badge>
                              )}
                              {column.type === 'AUTO_NUMBER' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setInvoiceSettingsColumn(column);
                                    setInvoiceSettingsOpen(true);
                                  }}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Invoice Settings
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleColumnEdit(column)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleColumnDelete(column)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trash" className="h-full m-0 p-6">
            <TrashView
              boardId={boardId!}
              onItemRestored={() => {
                fetchColumns();
                // Optionally switch to table view after restore
              }}
            />
          </TabsContent>

          <TabsContent value="archive" className="h-full m-0 p-6">
            <ArchiveView
              boardId={boardId!}
              onItemRestored={() => {
                fetchColumns();
                // Optionally switch to table view after restore
              }}
            />
          </TabsContent>
        </Tabs>

        <CreateColumnDialog
          open={columnDialogOpen}
          onOpenChange={setColumnDialogOpen}
          boardId={boardId!}
          column={editingColumn}
          existingColumns={columns}
          onSuccess={handleColumnDialogSuccess}
        />

        <DeleteColumnDialog
          open={deleteColumnDialogOpen}
          onOpenChange={setDeleteColumnDialogOpen}
          column={columnToDelete}
          onSuccess={handleDeleteColumnSuccess}
        />

        {invoiceSettingsColumn && (
          <InvoiceNumberingSettings
            open={invoiceSettingsOpen}
            onOpenChange={setInvoiceSettingsOpen}
            column={invoiceSettingsColumn}
            boardId={boardId!}
            onSuccess={() => {
              fetchColumns();
              setInvoiceSettingsColumn(null);
            }}
          />
        )}

        {/* Quick Switcher Dialog */}
        {boardId && quickSwitcher.QuickSwitcher}
      </div>
    </div>
  );
};

export default BoardDetailPage;

