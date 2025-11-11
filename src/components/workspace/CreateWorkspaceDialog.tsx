import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { workspaceAPI } from '@/lib/api';
import { CreateWorkspaceInput } from '@/types/workspace';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: '',
    description: '',
    logo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Workspace name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      // Clean up empty strings - convert to undefined so they're omitted
      const cleanedData = {
        name: formData.name.trim(),
        ...(formData.description?.trim() ? { description: formData.description.trim() } : {}),
        ...(formData.logo?.trim() ? { logo: formData.logo.trim() } : {}),
      };
      const response = await workspaceAPI.createWorkspace(cleanedData);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Workspace created successfully',
        });
        setFormData({ name: '', description: '', logo: '' });
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create workspace',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your boards and collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Acme Corporation"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the workspace..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL (Optional)</Label>
            <Input
              id="logo"
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

