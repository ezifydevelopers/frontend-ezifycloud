import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, X } from 'lucide-react';
import { Column } from '@/types/workspace';
import { formatCellValue } from '../table/utils/cellValueFormatter';
import { cn } from '@/lib/utils';

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Record<string, unknown>;
  columns: Column[];
  onSubmit: () => void;
  submitting?: boolean;
}

export const FormPreviewDialog: React.FC<FormPreviewDialogProps> = ({
  open,
  onOpenChange,
  formData,
  columns,
  onSubmit,
  submitting = false,
}) => {
  const getFieldValue = (column: Column) => {
    const value = formData[column.id];
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">Not filled</span>;
    }
    return formatCellValue(value, column);
  };

  const visibleColumns = columns.filter(col => !col.isHidden && formData[col.id] !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Form Preview
          </DialogTitle>
          <DialogDescription>
            Review your form submission before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {visibleColumns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No fields filled yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleColumns.map((column) => (
                <div key={column.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {column.name}
                    </span>
                    {column.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    {getFieldValue(column)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

