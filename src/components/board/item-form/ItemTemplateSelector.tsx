// Item template selector - create item from template

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Item, Column } from '@/types/workspace';

interface ItemTemplate {
  id: string;
  name: string;
  description?: string;
  cells?: Record<string, unknown>;
  boardId?: string;
}

interface ItemTemplateSelectorProps {
  boardId: string;
  columns: Column[];
  onTemplateSelect: (template: ItemTemplate) => void;
  onCancel?: () => void;
}

export const ItemTemplateSelector: React.FC<ItemTemplateSelectorProps> = ({
  boardId,
  columns,
  onTemplateSelect,
  onCancel,
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        // Fetch item templates for this board
        // In a real implementation, this would fetch from an API endpoint like /boards/{boardId}/item-templates
        // For now, we'll fetch from localStorage or a mock API
        const storedTemplates = localStorage.getItem(`itemTemplates_${boardId}`);
        if (storedTemplates) {
          const parsed = JSON.parse(storedTemplates);
          setTemplates(Array.isArray(parsed) ? parsed : []);
        } else {
          // Try to fetch from API if endpoint exists
          try {
            const token = localStorage.getItem('token');
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
            const res = await fetch(`${API_BASE}/boards/${boardId}/item-templates`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const json = await res.json();
              setTemplates(Array.isArray(json.data) ? json.data : []);
            }
          } catch {
            // API endpoint might not exist yet
            setTemplates([]);
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [boardId]);

  const handleSelect = () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Error',
        description: 'Please select a template',
        variant: 'destructive',
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onTemplateSelect(template);
    }
  };

  // Allow creating template from selected items
  const handleCreateTemplate = async (item: Item) => {
    try {
      const template: ItemTemplate = {
        id: `template_${Date.now()}`,
        name: `${item.name} Template`,
        description: `Template based on "${item.name}"`,
        cells: item.cells,
        boardId,
      };

      const stored = localStorage.getItem(`itemTemplates_${boardId}`);
      const existing = stored ? JSON.parse(stored) : [];
      existing.push(template);
      localStorage.setItem(`itemTemplates_${boardId}`, JSON.stringify(existing));

      setTemplates([...templates, template]);
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-slate-50">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <Label className="text-base font-semibold">Create from Template</Label>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">
            No templates available. Create a template by duplicating an item and saving it as a template.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="template-select">Select Template</Label>
            <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSelect}
              disabled={!selectedTemplateId}
              size="sm"
              className="flex-1"
            >
              Use Template
            </Button>
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                size="sm"
              >
                Cancel
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

