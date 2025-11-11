import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  Settings,
  ArrowLeft,
  MoreVertical,
  Plus,
  Save,
} from 'lucide-react';
import { Board } from '@/types/workspace';
import { ViewTabs } from './ViewTabs';
import { ViewManagement } from './ViewManagement';
import { ApprovalWorkflowSetup } from './ApprovalWorkflowSetup';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/lib/config';

const API_BASE = APP_CONFIG.API_BASE_URL;

interface BoardHeaderProps {
  board: Board;
  workspaceId: string;
  boardId: string;
  activeTab: string;
  activeViewId?: string;
  columns: Array<{ id: string; name: string }>;
  onViewChange: (viewType: string) => void;
  onSavedViewChange: (view: { id: string; name: string; type: string }) => void;
  onBackToWorkspace: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  workspaceId,
  boardId,
  activeTab,
  activeViewId,
  columns,
  onViewChange,
  onSavedViewChange,
  onBackToWorkspace,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSaveAsTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/boards/${boardId}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: `${board?.name} Template`, description: board?.description }),
      });
      if (!res.ok) throw new Error('Failed to save template');
      toast({ title: 'Template saved', description: 'Board saved as template' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save template', variant: 'destructive' });
    }
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-20">
      {/* Top Section: Board Title & Actions */}
      <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Board Title with Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToWorkspace}
              className="h-8 px-2 sm:px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-gray-50 rounded-md px-1 sm:px-2 py-1 transition-colors min-w-0">
                  <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-1 sm:gap-2 truncate">
                    <span className="truncate">{board.name}</span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  </h1>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={handleSaveAsTemplate} className="text-sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save as Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/workspaces/${workspaceId}/boards/${boardId}/settings`)} className="text-sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Board Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm text-red-600">
                  Archive Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {board.type && (
              <Badge variant="outline" className="capitalize font-medium text-xs px-1.5 sm:px-2 py-0.5 border-gray-300 text-gray-700 flex-shrink-0 hidden sm:inline-flex">
                {board.type}
              </Badge>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <ApprovalWorkflowSetup boardId={boardId} workspaceId={workspaceId} />
              <ViewManagement
                boardId={boardId}
                currentView={activeTab}
                columns={columns}
                onViewChange={(view) => {
                  onSavedViewChange(view);
                }}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="md:hidden">
                  <DropdownMenuItem className="text-sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Board Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem onClick={handleSaveAsTemplate} className="text-sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save as Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm">Import</DropdownMenuItem>
                <DropdownMenuItem className="text-sm">Export</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm text-red-600">
                  Archive Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Bottom Section: View Tabs */}
      <div className="px-3 sm:px-4 md:px-6 py-2 overflow-x-auto">
        <ViewTabs
          boardId={boardId}
          currentView={activeTab}
          currentViewId={activeViewId}
          onViewChange={onViewChange}
          onSavedViewChange={onSavedViewChange}
        />
      </div>
    </div>
  );
};

