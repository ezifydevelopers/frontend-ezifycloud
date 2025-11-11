import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { boardAPI } from '@/lib/api';
import { CreateBoardInput, BoardType } from '@/types/workspace';
import { SelectGroup, SelectLabel } from '@/components/ui/select';
import { APP_CONFIG } from '@/lib/config';
const API_BASE = APP_CONFIG.API_BASE_URL; // already includes /api

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onSuccess?: () => void;
}

export const CreateBoardDialog: React.FC<CreateBoardDialogProps> = ({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBoardInput>({
    workspaceId,
    name: '',
    type: 'custom',
    description: '',
  });
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; category?: string }>>([]);
  const [createMode, setCreateMode] = useState<'blank' | 'template'>('blank');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/templates?workspaceId=${workspaceId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setTemplates(Array.isArray(json.data) ? json.data : []);
        }
      } catch {}
    };
    if (open) fetchTemplates();
  }, [open, workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Board name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      let ok = false;
      if (createMode === 'template' && selectedTemplateId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/templates/${selectedTemplateId}/create-board`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ workspaceId, overrides: { name: formData.name || undefined } }),
        });
        ok = res.ok;
      } else {
        const cleanedData: Record<string, unknown> = {
          workspaceId: formData.workspaceId,
          name: formData.name.trim(),
          type: formData.type,
        };
        if (formData.description?.trim()) {
          cleanedData.description = formData.description.trim();
        }
        const response = await boardAPI.createBoard(cleanedData as CreateBoardInput);
        ok = response.success;
      }

      if (ok) {
        toast({
          title: 'Success',
          description: 'Board created successfully',
        });
        setFormData({ workspaceId, name: '', type: 'custom', description: '' });
        onOpenChange(false);
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to create board');
      }
    } catch (error) {
      console.error('Error creating board:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create board',
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
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Create a new board to organize your items and collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Creation Mode</Label>
            <Select value={createMode} onValueChange={(v) => setCreateMode(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">Blank</SelectItem>
                <SelectItem value="template">From Template</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Board Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Invoice Management"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Board Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as BoardType })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select board type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoices">Invoices</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {createMode === 'template' && (
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplateId || ''} onValueChange={(v) => setSelectedTemplateId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={templates.length ? 'Select a template' : 'No templates available'} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the board..."
              rows={3}
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
              {loading ? 'Creating...' : 'Create Board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

