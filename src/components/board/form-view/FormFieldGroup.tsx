import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Column } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface FormFieldGroupProps {
  groupId: string;
  groupName: string;
  groupDescription?: string;
  columns: Column[];
  formData: Record<string, unknown>;
  onFieldChange: (columnId: string, value: unknown) => void;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
  renderField: (column: Column, value: unknown, onChange: (value: unknown) => void) => React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  groupId,
  groupName,
  groupDescription,
  columns,
  formData,
  onFieldChange,
  workspaceMembers,
  renderField,
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  if (columns.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader 
        className={cn(
          collapsible && "cursor-pointer hover:bg-slate-50/50",
          "pb-3"
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{groupName}</CardTitle>
            {groupDescription && (
              <p className="text-sm text-muted-foreground mt-1">{groupDescription}</p>
            )}
          </div>
          {collapsible && (
            <span className="text-sm text-muted-foreground">
              {isCollapsed ? '▼' : '▲'}
            </span>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-6">
          {columns.map((column) => (
            <div key={column.id}>
              {renderField(column, formData[column.id], (value) => onFieldChange(column.id, value))}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

