import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  UserPlus,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { workspaceAPI, boardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Assignee {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface ItemAssignmentsProps {
  itemId: string;
  boardId?: string;
  workspaceId?: string;
  columnId?: string; // PEOPLE column ID if assignments are stored in cells
  onUpdate?: () => void;
  className?: string;
}

export const ItemAssignments: React.FC<ItemAssignmentsProps> = ({
  itemId,
  boardId,
  workspaceId,
  columnId,
  onUpdate,
  className,
}) => {
  const { toast } = useToast();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [members, setMembers] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const response = await workspaceAPI.getWorkspaceMembers(workspaceId);
      if (response.success && response.data) {
        const membersData = Array.isArray(response.data) ? response.data : [];
        const formattedMembers = membersData.map((member: Record<string, unknown>) => ({
          id: String(
            member.userId || 
            (member.user && typeof member.user === 'object' && 'id' in member.user ? member.user.id : '')
          ),
          name: String(
            member.user && typeof member.user === 'object' && 'name' in member.user
              ? member.user.name
              : member.email || 'Unknown'
          ),
          email: String(
            member.user && typeof member.user === 'object' && 'email' in member.user
              ? member.user.email
              : member.email || ''
          ),
          profilePicture: 
            member.user && typeof member.user === 'object' && 'profilePicture' in member.user
              ? String(member.user.profilePicture || '')
              : undefined,
        }));
        setMembers(formattedMembers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [workspaceId]);

  const fetchAssignments = useCallback(async () => {
    if (!boardId || !columnId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch item to get cell value
      const response = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 1000,
      });

      if (response.success && response.data) {
        const itemsData = (response.data as { data?: unknown[] })?.data || [];
        const item = itemsData.find((i: { id?: string }) => i.id === itemId) as { cells?: Record<string, unknown> } | undefined;
        
        if (item?.cells && item.cells[columnId]) {
          const cellValue = item.cells[columnId];
          const assigneeIds = Array.isArray(cellValue) 
            ? cellValue.map(id => String(id))
            : cellValue 
            ? [String(cellValue)]
            : [];

          // Map assignee IDs to full user objects
          const assignedUsers = members
            .filter(m => assigneeIds.includes(m.id))
            .map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              profilePicture: m.profilePicture,
            }));
          
          setAssignees(assignedUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [boardId, itemId, columnId, members]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (members.length > 0) {
      fetchAssignments();
    }
  }, [members, fetchAssignments]);

  const handleAddAssignee = async (userId: string) => {
    if (!columnId || !boardId) {
      toast({
        title: 'Error',
        description: 'Assignment column not configured',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(true);

      // Get current item
      const itemsResponse = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 1000,
      });

      if (itemsResponse.success && itemsResponse.data) {
        const itemsData = (itemsResponse.data as { data?: unknown[] })?.data || [];
        const item = itemsData.find((i: { id?: string }) => i.id === itemId);

        if (item) {
          const currentCells = (item as { cells?: Record<string, unknown> }).cells || {};
          const currentAssignees = currentCells[columnId];
          const assigneeArray = Array.isArray(currentAssignees)
            ? currentAssignees.map(id => String(id))
            : currentAssignees
            ? [String(currentAssignees)]
            : [];

          if (!assigneeArray.includes(userId)) {
            assigneeArray.push(userId);

            const updatedCells = {
              ...currentCells,
              [columnId]: assigneeArray,
            };

            const updateResponse = await boardAPI.updateItem(itemId, {
              cells: updatedCells,
            });

            if (updateResponse.success) {
              // Note: Assignment notifications are automatically created by the backend
              // when an item is updated with new assignees (see boardService.ts)

              toast({
                title: 'Success',
                description: 'Assignee added',
              });
              fetchAssignments();
              onUpdate?.();
            } else {
              throw new Error(updateResponse.message || 'Failed to add assignee');
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add assignee',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    if (!columnId || !boardId) return;

    try {
      setUpdating(true);

      const itemsResponse = await boardAPI.getBoardItems(boardId, {
        page: 1,
        limit: 1000,
      });

      if (itemsResponse.success && itemsResponse.data) {
        const itemsData = (itemsResponse.data as { data?: unknown[] })?.data || [];
        const item = itemsData.find((i: { id?: string }) => i.id === itemId);

        if (item) {
          const currentCells = (item as { cells?: Record<string, unknown> }).cells || {};
          const currentAssignees = currentCells[columnId];
          const assigneeArray = Array.isArray(currentAssignees)
            ? currentAssignees.map(id => String(id))
            : currentAssignees
            ? [String(currentAssignees)]
            : [];

          const updatedAssignees = assigneeArray.filter(id => id !== userId);

          const updatedCells = {
            ...currentCells,
            [columnId]: updatedAssignees.length > 0 ? updatedAssignees : null,
          };

          const updateResponse = await boardAPI.updateItem(itemId, {
            cells: updatedCells,
          });

          if (updateResponse.success) {
            toast({
              title: 'Success',
              description: 'Assignee removed',
            });
            fetchAssignments();
            onUpdate?.();
          } else {
            throw new Error(updateResponse.message || 'Failed to remove assignee');
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove assignee',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const availableMembers = members.filter(
    m => !assignees.some(a => a.id === m.id)
  );

  if (loading) {
    return (
      <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!columnId) {
    return (
      <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create a PEOPLE column on this board to enable assignments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Assignments ({assignees.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignees */}
        {assignees.length > 0 ? (
          <div className="space-y-2">
            {assignees.map((assignee) => (
              <div
                key={assignee.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={assignee.profilePicture} />
                    <AvatarFallback>
                      {assignee.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{assignee.name}</p>
                    <p className="text-xs text-muted-foreground">{assignee.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAssignee(assignee.id)}
                  disabled={updating}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No assignees yet
          </p>
        )}

        {/* Add Assignee */}
        {availableMembers.length > 0 && (
          <div className="pt-2 border-t">
            <Select
              value=""
              onValueChange={handleAddAssignee}
              disabled={updating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Assign to someone..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {availableMembers.length === 0 && assignees.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            All workspace members are assigned
          </p>
        )}
      </CardContent>
    </Card>
  );
};

