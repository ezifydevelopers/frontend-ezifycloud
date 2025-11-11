import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Share2, X, User, Users } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { workspaceAPI } from '@/lib/api';

interface DashboardSharingProps {
  dashboardId: string;
  workspaceId: string;
  isPublic: boolean;
  sharedWith?: string[];
  onUpdate?: () => void;
}

export const DashboardSharing: React.FC<DashboardSharingProps> = ({
  dashboardId,
  workspaceId,
  isPublic: initialIsPublic,
  sharedWith: initialSharedWith = [],
  onUpdate,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [sharedWith, setSharedWith] = useState<string[]>(initialSharedWith);
  const [emailInput, setEmailInput] = useState('');

  // Fetch workspace members
  const { data: membersData } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: async () => {
      const response = await workspaceAPI.getWorkspaceMembers(workspaceId);
      return response.data as Array<{ id: string; name: string; email: string }>;
    },
    enabled: open && !!workspaceId,
  });

  const members = membersData || [];

  const handleTogglePublic = async (checked: boolean) => {
    try {
      setLoading(true);
      await dashboardAPI.updateDashboard(dashboardId, {
        isPublic: checked,
      });
      setIsPublic(checked);
      toast({
        title: 'Success',
        description: checked
          ? 'Dashboard is now public'
          : 'Dashboard is now private',
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (userId: string) => {
    if (!sharedWith.includes(userId)) {
      setSharedWith([...sharedWith, userId]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSharedWith(sharedWith.filter(id => id !== userId));
  };

  const handleSaveSharing = async () => {
    try {
      setLoading(true);
      await dashboardAPI.shareDashboard(dashboardId, sharedWith);
      toast({
        title: 'Success',
        description: 'Dashboard sharing updated',
      });
      setOpen(false);
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update sharing',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Dashboard</DialogTitle>
          <DialogDescription>
            Control who can view this dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public">Make Public</Label>
              <p className="text-sm text-muted-foreground">
                Anyone in the workspace can view this dashboard
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={loading}
            />
          </div>

          {/* Share with Specific Users */}
          {!isPublic && (
            <div className="space-y-2">
              <Label>Share with Users</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by email..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {members
                    .filter(m => 
                      !emailInput || 
                      m.email.toLowerCase().includes(emailInput.toLowerCase()) ||
                      m.name.toLowerCase().includes(emailInput.toLowerCase())
                    )
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-accent cursor-pointer"
                        onClick={() => {
                          if (sharedWith.includes(member.id)) {
                            handleRemoveUser(member.id);
                          } else {
                            handleAddUser(member.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                        {sharedWith.includes(member.id) && (
                          <Badge variant="default">Shared</Badge>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Selected Users */}
              {sharedWith.length > 0 && (
                <div className="space-y-2">
                  <Label>Shared With ({sharedWith.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {sharedWith.map((userId) => {
                      const member = members.find(m => m.id === userId);
                      return member ? (
                        <Badge key={userId} variant="secondary" className="gap-1">
                          {member.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveUser(userId)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {!isPublic && (
            <Button onClick={handleSaveSharing} disabled={loading}>
              Save Sharing
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

