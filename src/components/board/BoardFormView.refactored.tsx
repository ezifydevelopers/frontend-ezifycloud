// Refactored BoardFormView - Reuses item-form field components

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Share2, CheckCircle2 } from 'lucide-react';
import { boardAPI } from '@/lib/api';
import { Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { SimpleFormFieldRenderer } from './form-view/SimpleFormFieldRenderer';
import { FormShareDialog } from './form-view/FormShareDialog';
import { useFormView } from './form-view/useFormView';

interface BoardFormViewProps {
  boardId: string;
  columns?: Column[];
  onItemCreate?: () => void;
  onItemEdit?: (item: any) => void;
  onItemDelete?: (item: any) => void;
  onColumnsChange?: () => void;
}

export const BoardFormView: React.FC<BoardFormViewProps> = ({
  boardId,
  columns = [],
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    formData,
    setFormData,
    workspaceMembers,
    convertFormDataToCells,
  } = useFormView({ boardId });

  const visibleColumns = columns.filter(col => !col.isHidden).sort((a, b) => a.position - b.position);

  const handleFieldChange = (columnId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [columnId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields: string[] = [];
    visibleColumns.forEach((column) => {
      if (column.required && (!formData[column.id] || formData[column.id] === '')) {
        missingFields.push(column.name);
      }
    });

    if (missingFields.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fill in required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const cells = convertFormDataToCells(formData, visibleColumns);
      
      const itemData = {
        name: formData['name'] as string || 'New Item',
        cells,
      };

      const response = await boardAPI.createItem(boardId, itemData);
      
      if (response.success) {
        setSubmitted(true);
        setFormData({});
        toast({
          title: 'Success',
          description: 'Item submitted successfully!',
        });
        onItemCreate?.();
      } else {
        throw new Error(response.message || 'Failed to submit form');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit form',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generateFormUrl = () => {
    const url = `${window.location.origin}/forms/${boardId}`;
    setFormUrl(url);
    return url;
  };

  const handleShare = () => {
    const url = generateFormUrl();
    setShareDialogOpen(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-6">Thank you for your submission.</p>
            <Button onClick={() => setSubmitted(false)}>Submit Another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Submit Item
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {visibleColumns.map((column) => (
              <SimpleFormFieldRenderer
                key={column.id}
                column={column}
                value={formData[column.id]}
                onChange={(value) => handleFieldChange(column.id, value)}
                workspaceMembers={workspaceMembers}
              />
            ))}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <FormShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        formUrl={formUrl}
      />
    </div>
  );
};

