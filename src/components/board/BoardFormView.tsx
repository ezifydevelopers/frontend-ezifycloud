// Refactored BoardFormView - Reuses item-form field components

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Share2, CheckCircle2, Settings, AlertCircle, Eye, CheckCircle } from 'lucide-react';
import { boardAPI } from '@/lib/api';
import { Column, Board } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { SimpleFormFieldRenderer } from './form-view/SimpleFormFieldRenderer';
import { FormShareDialog } from './form-view/FormShareDialog';
import { FormSettingsDialog } from './form-view/FormSettingsDialog';
import { FormPreviewDialog } from './form-view/FormPreviewDialog';
import { FormFieldGroup } from './form-view/FormFieldGroup';
import { validateForm, ValidationError } from './form-view/formValidation';
import { useConditionalFields, shouldShowField, isFieldRequired } from './form-view/useConditionalFields';
import { useFormView } from './form-view/useFormView';
import { cn } from '@/lib/utils';

interface BoardFormViewProps {
  boardId: string;
  columns?: Column[];
  board?: Board;
  onItemCreate?: () => void;
  onItemEdit?: (item: any) => void;
  onItemDelete?: (item: any) => void;
  onColumnsChange?: () => void;
}

export const BoardFormView: React.FC<BoardFormViewProps> = ({
  boardId,
  columns = [],
  board,
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [boardData, setBoardData] = useState<Board | null>(board || null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    formData,
    setFormData,
    workspaceMembers,
    convertFormDataToCells,
  } = useFormView({ boardId });

  // Get visible columns (filtered by isHidden and conditional logic)
  const allVisibleColumns = columns.filter(col => !col.isHidden).sort((a, b) => a.position - b.position);
  const visibleColumns = useConditionalFields(allVisibleColumns, formData);
  
  // Group columns by groupId (if specified in settings)
  const groupedColumns = React.useMemo(() => {
    const groups: Record<string, Column[]> = {};
    const ungrouped: Column[] = [];

    visibleColumns.forEach(column => {
      const settings = column.settings as Record<string, unknown> | undefined;
      const groupId = settings?.groupId as string | undefined;
      
      if (groupId) {
        if (!groups[groupId]) {
          groups[groupId] = [];
        }
        groups[groupId].push(column);
      } else {
        ungrouped.push(column);
      }
    });

    return { groups, ungrouped };
  }, [visibleColumns]);

  // Get group metadata from columns
  const getGroupMetadata = React.useCallback((groupId: string) => {
    const columnInGroup = visibleColumns.find(col => {
      const settings = col.settings as Record<string, unknown> | undefined;
      return settings?.groupId === groupId;
    });
    
    if (!columnInGroup) return null;
    
    const settings = columnInGroup.settings as Record<string, unknown> | undefined;
    const groupSettings = settings?.groupSettings as {
      name?: string;
      description?: string;
      collapsible?: boolean;
      defaultCollapsed?: boolean;
    } | undefined;

    return {
      name: groupSettings?.name || `Group ${groupId}`,
      description: groupSettings?.description,
      collapsible: groupSettings?.collapsible || false,
      defaultCollapsed: groupSettings?.defaultCollapsed || false,
    };
  }, [visibleColumns]);

  // Fetch board data if not provided
  useEffect(() => {
    if (!board && boardId) {
      boardAPI.getBoardById(boardId).then((response) => {
        if (response.success && response.data) {
          setBoardData(response.data as Board);
        }
      });
    }
  }, [board, boardId]);

  // Get form design settings from board
  const formDesign = React.useMemo(() => {
    if (!boardData?.settings) return null;
    const settings = boardData.settings as Record<string, unknown>;
    return settings.formDesign as {
      primaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
      buttonColor?: string;
      buttonTextColor?: string;
      borderRadius?: string;
      layout?: string;
      headerText?: string;
      footerText?: string;
      logoUrl?: string;
      showLogo?: boolean;
      customCSS?: string;
    } | undefined;
  }, [boardData]);

  // Generate form URL
  useEffect(() => {
    if (boardData?.isPublic) {
      const url = `${window.location.origin}/forms/${boardId}`;
      setFormUrl(url);
    }
  }, [boardId, boardData?.isPublic]);

  const handleFieldChange = (columnId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [columnId]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Enhanced validation (check both required and conditionally required fields)
    const columnsToValidate = visibleColumns.map(col => ({
      ...col,
      required: isFieldRequired(col, formData) || col.required,
    }));
    
    const validation = validateForm(columnsToValidate, formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: 'Validation Error',
        description: validation.errors.map(e => e.message).join(', '),
        variant: 'destructive',
      });
      setPreviewOpen(false);
      return;
    }

    setValidationErrors([]);
    setPreviewOpen(false);

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
        setShowConfirmation(true);
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

  const handlePreview = () => {
    // Basic validation before showing preview
    const columnsToValidate = visibleColumns.filter(col => col.required);
    const validation = validateForm(columnsToValidate, formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields before previewing',
        variant: 'destructive',
      });
      return;
    }
    
    setPreviewOpen(true);
  };

  const handleShare = () => {
    if (!boardData?.isPublic) {
      toast({
        title: 'Form Not Public',
        description: 'Please enable public form in settings first',
        variant: 'destructive',
      });
      setSettingsDialogOpen(true);
      return;
    }
    setShareDialogOpen(true);
  };

  if (submitted && showConfirmation) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-6">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Form Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-2 text-lg">
              Thank you for your submission. Your form has been received.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              You will receive a confirmation email shortly.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => {
                setSubmitted(false);
                setShowConfirmation(false);
                setFormData({});
              }}>
                Submit Another
              </Button>
              <Button onClick={() => {
                setSubmitted(false);
                setShowConfirmation(false);
              }}>
                View Submission
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Apply custom form design
  const formStyle = React.useMemo(() => {
    if (!formDesign) return {};
    
    const borderRadiusMap: Record<string, string> = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '16px',
    };

    return {
      '--form-primary-color': formDesign.primaryColor || '#3b82f6',
      '--form-bg-color': formDesign.backgroundColor || '#ffffff',
      '--form-text-color': formDesign.textColor || '#1f2937',
      '--form-button-color': formDesign.buttonColor || '#3b82f6',
      '--form-button-text-color': formDesign.buttonTextColor || '#ffffff',
      '--form-border-radius': borderRadiusMap[formDesign.borderRadius || 'medium'] || '8px',
    } as React.CSSProperties;
  }, [formDesign]);

  const formLayoutClass = formDesign?.layout === 'left' ? 'items-start' : 
                          formDesign?.layout === 'right' ? 'items-end' : 
                          'items-center';

  return (
    <div 
      className={cn('min-h-screen p-6', formLayoutClass === 'items-center' && 'flex')}
      style={{
        backgroundColor: formDesign?.backgroundColor || '#f9fafb',
        ...formStyle,
      }}
    >
      <div className={cn('w-full max-w-2xl mx-auto')}>
        {/* Header */}
        {formDesign?.headerText && (
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2" style={{ color: formDesign.textColor || '#1f2937' }}>
              {formDesign.headerText}
            </h1>
          </div>
        )}

        {/* Logo */}
        {formDesign?.showLogo && formDesign?.logoUrl && (
          <div className="mb-6 flex justify-center">
            <img 
              src={formDesign.logoUrl} 
              alt="Logo" 
              className="h-16 object-contain"
            />
          </div>
        )}

        <Card 
          style={{
            backgroundColor: formDesign?.backgroundColor || '#ffffff',
            borderRadius: formStyle['--form-border-radius'] as string,
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: formDesign?.textColor || '#1f2937' }}>
                <FileText className="h-5 w-5" />
                {boardData?.name || 'Submit Item'}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSettingsDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!boardData?.isPublic && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 mb-1">Form is not public</p>
                  <p className="text-sm text-yellow-800">
                    Enable public form in settings to share this form with others.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Render grouped columns */}
              {Object.entries(groupedColumns.groups).map(([groupId, groupColumns]) => {
                const groupMeta = getGroupMetadata(groupId);
                if (!groupMeta) return null;

                return (
                  <FormFieldGroup
                    key={groupId}
                    groupId={groupId}
                    groupName={groupMeta.name}
                    groupDescription={groupMeta.description}
                    columns={groupColumns}
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    workspaceMembers={workspaceMembers}
                    renderField={(column, value, onChange) => {
                      const fieldError = validationErrors.find(e => e.fieldId === column.id);
                      const isRequiredField = isFieldRequired(column, formData) || column.required;
                      
                      return (
                        <div>
                          <SimpleFormFieldRenderer
                            column={{
                              ...column,
                              required: isRequiredField,
                            }}
                            value={value}
                            onChange={(val) => {
                              onChange(val);
                              // Clear error when user starts typing
                              if (fieldError) {
                                setValidationErrors(prev => prev.filter(e => e.fieldId !== column.id));
                              }
                            }}
                            workspaceMembers={workspaceMembers}
                          />
                          {fieldError && (
                            <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {fieldError.message}
                            </p>
                          )}
                        </div>
                      );
                    }}
                    collapsible={groupMeta.collapsible}
                    defaultCollapsed={groupMeta.defaultCollapsed}
                  />
                );
              })}

              {/* Render ungrouped columns */}
              {groupedColumns.ungrouped.length > 0 && (
                <div className="space-y-6">
                  {groupedColumns.ungrouped.map((column) => {
                    const fieldError = validationErrors.find(e => e.fieldId === column.id);
                    const isRequiredField = isFieldRequired(column, formData) || column.required;
                    
                    return (
                      <div key={column.id}>
                        <SimpleFormFieldRenderer
                          column={{
                            ...column,
                            required: isRequiredField,
                          }}
                          value={formData[column.id]}
                          onChange={(value) => {
                            handleFieldChange(column.id, value);
                            // Clear error when user starts typing
                            if (fieldError) {
                              setValidationErrors(prev => prev.filter(e => e.fieldId !== column.id));
                            }
                          }}
                          workspaceMembers={workspaceMembers}
                        />
                        {fieldError && (
                          <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldError.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={submitting}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1"
                  style={{
                    backgroundColor: formDesign?.buttonColor || '#3b82f6',
                    color: formDesign?.buttonTextColor || '#ffffff',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        {formDesign?.footerText && (
          <div className="mt-6 text-center text-sm" style={{ color: formDesign.textColor || '#6b7280' }}>
            {formDesign.footerText}
          </div>
        )}

        {/* Custom CSS */}
        {formDesign?.customCSS && (
          <style dangerouslySetInnerHTML={{ __html: formDesign.customCSS }} />
        )}
      </div>

      <FormShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        formUrl={formUrl}
        boardName={boardData?.name}
      />

      <FormSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        boardId={boardId}
        isPublic={boardData?.isPublic || false}
        formSettings={formDesign || undefined}
        onSettingsChange={() => {
          // Refresh board data
          boardAPI.getBoardById(boardId).then((response) => {
            if (response.success && response.data) {
              setBoardData(response.data as Board);
            }
          });
          onColumnsChange?.();
        }}
      />

      <FormPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        formData={formData}
        columns={visibleColumns}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
};

