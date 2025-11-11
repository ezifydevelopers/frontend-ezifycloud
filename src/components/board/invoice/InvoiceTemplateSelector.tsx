// Invoice Template Selector Component - Select template for viewing/printing invoice

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invoiceTemplateAPI } from '@/lib/api';
import { InvoiceTemplate } from '@/types/invoice';
import { InvoiceTemplateBuilder } from './InvoiceTemplateBuilder';

interface InvoiceTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
  selectedTemplateId?: string;
  onTemplateSelect: (template: InvoiceTemplate) => void;
  onCreateNew?: () => void;
}

export const InvoiceTemplateSelector: React.FC<InvoiceTemplateSelectorProps> = ({
  open,
  onOpenChange,
  workspaceId,
  selectedTemplateId,
  onTemplateSelect,
  onCreateNew,
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedTemplateId);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, workspaceId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await invoiceTemplateAPI.getTemplates(workspaceId);
      if (response.success && response.data) {
        setTemplates(response.data as InvoiceTemplate[]);
        
        // Set default template if available and none selected
        if (!selectedId) {
          const defaultTemplate = (response.data as InvoiceTemplate[]).find(t => t.isDefault);
          if (defaultTemplate) {
            setSelectedId(defaultTemplate.id);
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    const template = templates.find(t => t.id === selectedId);
    if (template) {
      onTemplateSelect(template);
      onOpenChange(false);
    } else {
      toast({
        title: 'Error',
        description: 'Please select a template',
        variant: 'destructive',
      });
    }
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setBuilderOpen(true);
    onOpenChange(false);
  };

  const handleEditTemplate = (template: InvoiceTemplate) => {
    setEditingTemplate(template);
    setBuilderOpen(true);
    onOpenChange(false);
  };

  const handleTemplateSaved = (template: InvoiceTemplate) => {
    fetchTemplates();
    setBuilderOpen(false);
    setEditingTemplate(null);
    // Auto-select the newly created/edited template
    setSelectedId(template.id);
    onTemplateSelect(template);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Invoice Template
            </DialogTitle>
            <DialogDescription>
              Choose a template to use for displaying and printing invoices
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Select Template</Label>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                  No templates available. Create a new template to get started.
                </div>
              ) : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          {template.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {templates.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">Available Templates</h4>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-slate-50 ${
                        selectedId === template.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedId(template.id)}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{template.name}</span>
                        {template.isDefault && (
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleCreateNew}>
                <FileText className="h-4 w-4 mr-2" />
                Create New Template
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSelect} disabled={!selectedId || templates.length === 0}>
                  Use Template
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Builder Dialog */}
      <InvoiceTemplateBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        template={editingTemplate}
        workspaceId={workspaceId}
        onSuccess={handleTemplateSaved}
      />
    </>
  );
};

