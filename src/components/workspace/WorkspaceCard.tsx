import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  FileText,
  Settings,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Workspace, WorkspaceRole } from '@/types/workspace';

interface WorkspaceCardProps {
  workspace: Workspace;
  userRole?: WorkspaceRole;
  onEdit?: (workspace: Workspace) => void;
  onDelete?: (workspace: Workspace) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  userRole,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  const getRoleBadgeColor = (role?: WorkspaceRole) => {
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

  return (
    <Card className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                {workspace.name}
              </h3>
              {workspace.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {workspace.description}
                </p>
              )}
              {userRole && (
                <Badge 
                  variant="outline" 
                  className={`mt-2 text-xs ${getRoleBadgeColor(userRole)}`}
                >
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              )}
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
              <DropdownMenuItem onClick={() => navigate(`/workspaces/${workspace.id}`)}>
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {(userRole === 'owner' || userRole === 'admin') && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(workspace)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Workspace
                </DropdownMenuItem>
              )}
              {userRole === 'owner' && onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(workspace)}
                  className="text-red-600"
                >
                  Delete Workspace
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
              <Users className="h-4 w-4" />
              <span>{workspace._count?.members || 0} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-4 w-4" />
              <span>{workspace._count?.boards || 0} boards</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/workspaces/${workspace.id}`)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Open
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

