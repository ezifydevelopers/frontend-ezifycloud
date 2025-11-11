import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WorkspaceCard } from '@/components/workspace/WorkspaceCard';
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog';
import PageHeader from '@/components/layout/PageHeader';
import { workspaceAPI } from '@/lib/api';
import { Workspace, WorkspaceRole } from '@/types/workspace';
import { APP_CONFIG } from '@/lib/config';
import {
  Building2,
  Plus,
  Search,
  Grid,
  List,
  RefreshCw,
  Frown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WorkspaceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<Record<string, WorkspaceRole>>({});

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      console.log('[Workspaces] Fetching list... search=', searchTerm || '(none)');
      
      // Check API base URL for debugging
      const apiBaseUrl = APP_CONFIG.API_BASE_URL;
      console.log('[Workspaces] API Base URL:', apiBaseUrl);
      console.log('[Workspaces] Full endpoint:', `${apiBaseUrl}/workspaces`);
      console.log('[Workspaces] Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
      
      // Add timeout to prevent hanging (increased to 15 seconds for slow connections)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - API took too long to respond. Please check if the backend server is running.')), 15000);
      });
      
      const response = await Promise.race([
        workspaceAPI.getWorkspaces({
          page: 1,
          limit: 100,
          search: searchTerm || undefined,
        }),
        timeoutPromise,
      ]) as any;

      console.log('[Workspaces] API raw response:', response);

      if (response && response.success && response.data !== undefined) {
        // Handle both nested data structure and direct array
        let workspacesData: any[] = [];
        if (Array.isArray(response.data)) {
          workspacesData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          workspacesData = response.data.data;
        } else if (response.data?.workspaces && Array.isArray(response.data.workspaces)) {
          workspacesData = response.data.workspaces;
        }
        
        console.log('[Workspaces] Parsed list length:', workspacesData.length);
        setWorkspaces(workspacesData as Workspace[]);
        
        // Extract user roles from member data
        const roles: Record<string, WorkspaceRole> = {};
        workspacesData.forEach((ws: any) => {
          if (ws.members && Array.isArray(ws.members) && ws.members.length > 0) {
            roles[ws.id] = ws.members[0].role as WorkspaceRole;
          }
        });
        console.log('[Workspaces] Derived roles:', roles);
        setUserRoles(roles);
      } else {
        console.warn('[Workspaces] Response not successful or missing data:', response);
        setWorkspaces([]);
        // Show warning if response exists but not in expected format
        if (response && !response.success) {
          toast({
            title: 'Warning',
            description: response.message || 'Failed to load workspaces',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('[Workspaces] Error fetching workspaces:', error);
      const errorMessage = error instanceof Error 
        ? (error as any).isConnectionError 
          ? 'Backend server is not running. Please start it with: cd backend-ezifycloud && npm run dev'
          : error.message
        : 'Unknown error occurred';
      toast({
        title: 'Error',
        description: `Failed to fetch workspaces: ${errorMessage}`,
        variant: 'destructive',
      });
      setWorkspaces([]);
      setUserRoles({});
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreateSuccess = () => {
    fetchWorkspaces();
  };

  const handleEdit = (workspace: Workspace) => {
    navigate(`/workspaces/${workspace.id}/settings`);
  };

  const handleDelete = async (workspace: Workspace) => {
    if (!confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await workspaceAPI.deleteWorkspace(workspace.id);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Workspace deleted successfully',
        });
        fetchWorkspaces();
      } else {
        throw new Error(response.message || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete workspace',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title="Workspaces"
            subtitle="Manage your workspaces and collaborate with your team"
            icon={Building2}
            iconColor="from-blue-600 to-purple-600"
          >
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => {
                  setIsRefreshing(true);
                  fetchWorkspaces();
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
                New Workspace
              </Button>
            </div>
          </PageHeader>

          {/* Search and Filters */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search workspaces by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-white/20 focus:bg-white/80"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workspaces Grid */}
          {workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  userRole={userRoles[workspace.id]}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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
                  {searchTerm ? 'No workspaces found' : 'No workspaces yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Create your first workspace to get started'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workspace
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Create Workspace Dialog */}
          <CreateWorkspaceDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={handleCreateSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceListPage;

