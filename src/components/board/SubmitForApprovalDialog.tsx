// Submit for Approval Dialog - Validates and submits items for approval

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { approvalAPI, workflowAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Item, Column } from '@/types/workspace';
import { ApprovalLevel } from '@/types/workspace';
import { getCellValue } from './table/utils/tableUtils';

interface SubmitForApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  columns: Column[];
  boardId: string;
  workspaceId?: string;
  onSuccess?: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

export const SubmitForApprovalDialog: React.FC<SubmitForApprovalDialogProps> = ({
  open,
  onOpenChange,
  item,
  columns,
  boardId,
  workspaceId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [requiredLevels, setRequiredLevels] = useState<ApprovalLevel[]>([]);
  const [workflowEvaluation, setWorkflowEvaluation] = useState<any>(null);

  useEffect(() => {
    if (open && item) {
      validateItem();
      evaluateWorkflow();
    }
  }, [open, item, columns]);

  const validateItem = () => {
    setValidating(true);
    const errors: ValidationError[] = [];

    // Check required columns
    columns.forEach(column => {
      if (column.required) {
        const value = getCellValue(item, column.id);
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push({
            field: column.name,
            message: `${column.name} is required`,
          });
        }
      }
    });

    // Check item name
    if (!item.name || item.name.trim() === '') {
      errors.push({
        field: 'Name',
        message: 'Item name is required',
      });
    }

    setValidationErrors(errors);
    setValidating(false);
    return errors.length === 0;
  };

  const evaluateWorkflow = async () => {
    try {
      const response = await workflowAPI.evaluateWorkflow(boardId, item.id);
      if (response.success && response.data) {
        setWorkflowEvaluation(response.data);
        
        // If auto-approved, show message
        if (response.data.autoApproved) {
          setRequiredLevels([]);
        } else {
          // Get required levels from evaluation
          setRequiredLevels(response.data.requiredLevels || []);
        }
      } else {
        // Fallback to default level 1
        setRequiredLevels(['LEVEL_1']);
      }
    } catch (error) {
      console.error('Error evaluating workflow:', error);
      // Fallback to default level 1
      setRequiredLevels(['LEVEL_1']);
    }
  };

  const handleSubmit = async () => {
    // Re-validate
    if (!validateItem()) {
      toast({
        title: 'Validation Failed',
        description: 'Please fix all required fields before submitting',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Use workflow evaluation to determine levels, or fallback to LEVEL_1
      const levelsToSubmit = requiredLevels.length > 0 ? requiredLevels : ['LEVEL_1'];

      const response = await approvalAPI.requestApproval(item.id, {
        levels: levelsToSubmit,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Item submitted for approval. ${levelsToSubmit.length > 1 ? `Requires ${levelsToSubmit.length} approval levels.` : 'Requires Level 1 approval.'}`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(response.message || 'Failed to submit for approval');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit for approval',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = validationErrors.length > 0;
  const canSubmit = !hasErrors && !validating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Submit for Approval
          </DialogTitle>
          <DialogDescription>
            Submit "{item.name}" for approval. The item will be routed based on workflow rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation Errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Please fix the following errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Workflow Evaluation */}
          {workflowEvaluation && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Approval Routing</h4>
              
              {workflowEvaluation.autoApproved ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    This item will be auto-approved based on workflow rules.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {requiredLevels.length > 0 ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        This item requires approval from:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {requiredLevels.map((level) => (
                          <Badge key={level} variant="outline" className="text-sm">
                            {level === 'LEVEL_1' && 'Level 1 - Sir Salman'}
                            {level === 'LEVEL_2' && 'Level 2 - Radhika'}
                            {level === 'LEVEL_3' && 'Level 3 - Finance Team'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No approval levels required based on workflow rules.
                    </p>
                  )}

                  {workflowEvaluation.skippedLevels && workflowEvaluation.skippedLevels.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        The following levels will be skipped: {workflowEvaluation.skippedLevels.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Validation Success */}
          {!hasErrors && !validating && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                All required fields are filled. Ready to submit for approval.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit for Approval
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

