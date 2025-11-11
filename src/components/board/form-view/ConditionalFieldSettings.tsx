import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, X } from 'lucide-react';
import { Column } from '@/types/workspace';
import { ConditionalRule } from './useConditionalFields';

interface ConditionalFieldSettingsProps {
  column: Column;
  allColumns: Column[];
  onSave: (settings: { conditional?: { showWhen?: ConditionalRule[]; hideWhen?: ConditionalRule[]; requiredWhen?: ConditionalRule[] } }) => void;
}

export const ConditionalFieldSettings: React.FC<ConditionalFieldSettingsProps> = ({
  column,
  allColumns,
  onSave,
}) => {
  const settings = column.settings as Record<string, unknown> | undefined;
  const conditional = settings?.conditional as {
    showWhen?: ConditionalRule[];
    hideWhen?: ConditionalRule[];
    requiredWhen?: ConditionalRule[];
  } | undefined;

  const [showWhen, setShowWhen] = useState<ConditionalRule[]>(conditional?.showWhen || []);
  const [hideWhen, setHideWhen] = useState<ConditionalRule[]>(conditional?.hideWhen || []);
  const [requiredWhen, setRequiredWhen] = useState<ConditionalRule[]>(conditional?.requiredWhen || []);

  const availableColumns = allColumns.filter(col => col.id !== column.id && !col.isHidden);

  const addRule = (rules: ConditionalRule[], setRules: (rules: ConditionalRule[]) => void) => {
    setRules([...rules, { fieldId: availableColumns[0]?.id || '', operator: 'equals', value: '' }]);
  };

  const removeRule = (rules: ConditionalRule[], setRules: (rules: ConditionalRule[]) => void, index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (
    rules: ConditionalRule[],
    setRules: (rules: ConditionalRule[]) => void,
    index: number,
    field: keyof ConditionalRule,
    value: unknown
  ) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleSave = () => {
    onSave({
      conditional: {
        ...(showWhen.length > 0 && { showWhen }),
        ...(hideWhen.length > 0 && { hideWhen }),
        ...(requiredWhen.length > 0 && { requiredWhen }),
      },
    });
  };

  const renderRuleEditor = (
    title: string,
    rules: ConditionalRule[],
    setRules: (rules: ConditionalRule[]) => void
  ) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addRule(rules, setRules)}
            disabled={availableColumns.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rules configured</p>
        ) : (
          rules.map((rule, index) => (
            <div key={index} className="flex gap-2 items-end p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Field</Label>
                  <Select
                    value={rule.fieldId}
                    onValueChange={(value) => updateRule(rules, setRules, index, 'fieldId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map(col => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={rule.operator}
                    onValueChange={(value) => updateRule(rules, setRules, index, 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="notEquals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="notContains">Not Contains</SelectItem>
                      <SelectItem value="greaterThan">Greater Than</SelectItem>
                      <SelectItem value="lessThan">Less Than</SelectItem>
                      <SelectItem value="isEmpty">Is Empty</SelectItem>
                      <SelectItem value="isNotEmpty">Is Not Empty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Value</Label>
                  {['isEmpty', 'isNotEmpty'].includes(rule.operator) ? (
                    <Input value="N/A" disabled />
                  ) : (
                    <Input
                      value={String(rule.value || '')}
                      onChange={(e) => updateRule(rules, setRules, index, 'value', e.target.value)}
                      placeholder="Value"
                    />
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRule(rules, setRules, index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {renderRuleEditor('Show Field When (all rules must pass)', showWhen, setShowWhen)}
      {renderRuleEditor('Hide Field When (any rule passes)', hideWhen, setHideWhen)}
      {renderRuleEditor('Make Required When (all rules must pass)', requiredWhen, setRequiredWhen)}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => {
          setShowWhen(conditional?.showWhen || []);
          setHideWhen(conditional?.hideWhen || []);
          setRequiredWhen(conditional?.requiredWhen || []);
        }}>
          Reset
        </Button>
        <Button onClick={handleSave}>Save Conditions</Button>
      </div>
    </div>
  );
};

