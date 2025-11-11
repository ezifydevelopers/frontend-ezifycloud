// Invoice numbering settings component - Manage invoice number configuration and counter

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Settings, Info, AlertTriangle } from 'lucide-react';
import { Column } from '@/types/workspace';
import { invoiceAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { boardAPI } from '@/lib/api';
import { AutoNumberSettings } from './column-form/settings/AutoNumberSettings';

interface InvoiceNumberingSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: Column;
  boardId: string;
  onSuccess?: () => void;
}

export const InvoiceNumberingSettings: React.FC<InvoiceNumberingSettingsProps> = ({
  open,
  onOpenChange,
  column,
  boardId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [settings, setSettings] = useState<any>(() => {
    const colSettings = (column.settings as any) || {};
    return {
      format: colSettings.format || '{number}',
      prefix: colSettings.prefix || '',
      suffix: colSettings.suffix || '',
      startNumber: colSettings.startNumber || 1,
      numberPadding: colSettings.numberPadding || 0,
      resetOn: colSettings.resetOn || 'never',
      lastCounter: colSettings.lastCounter || 0,
    };
  });
  const [resetTo, setResetTo] = useState<string>('1');

  useEffect(() => {
    if (open && column.type === 'AUTO_NUMBER') {
      fetchPreview();
      // Load current settings
      const colSettings = (column.settings as any) || {};
      setSettings({
        format: colSettings.format || '{number}',
        prefix: colSettings.prefix || '',
        suffix: colSettings.suffix || '',
        startNumber: colSettings.startNumber || 1,
        numberPadding: colSettings.numberPadding || 0,
        resetOn: colSettings.resetOn || 'never',
        lastCounter: colSettings.lastCounter || 0,
      });
      setResetTo(String(colSettings.startNumber || 1));
    }
  }, [open, column]);

  const fetchPreview = async () => {
    try {
      const response = await invoiceAPI.previewInvoiceNumber(column.id);
      if (response.success && response.data) {
        setPreview((response.data as any).preview || '');
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);

      // Update column settings
      const response = await boardAPI.updateColumn(column.id, {
        settings: {
          ...settings,
        },
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Invoice numbering settings saved successfully',
        });
        fetchPreview();
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetCounter = async () => {
    if (!confirm('Are you sure you want to reset the invoice counter? This will start numbering from the specified number.')) {
      return;
    }

    try {
      setLoading(true);
      const resetToNumber = parseInt(resetTo, 10);
      
      if (isNaN(resetToNumber) || resetToNumber < 1) {
        toast({
          title: 'Error',
          description: 'Please enter a valid number (1 or higher)',
          variant: 'destructive',
        });
        return;
      }

      const response = await invoiceAPI.resetInvoiceCounter(column.id, resetToNumber);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Invoice counter reset successfully',
        });
        
        // Update local settings
        setSettings({
          ...settings,
          lastCounter: resetToNumber - 1,
          startNumber: resetToNumber,
        });
        
        fetchPreview();
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to reset counter');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset counter',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (column.type !== 'AUTO_NUMBER') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Invoice Numbering Settings
          </DialogTitle>
          <DialogDescription>
            Configure how invoice numbers are automatically generated for "{column.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Settings */}
          <AutoNumberSettings
            column={column}
            settings={settings}
            onSettingsChange={setSettings}
          />

          {/* Preview Section */}
          {preview && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-blue-900">Next Invoice Number</Label>
                  <p className="text-2xl font-mono font-bold text-blue-700 mt-2">{preview}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPreview}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Preview
                </Button>
              </div>
            </div>
          )}

          {/* Counter Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>Current counter: <strong>{settings.lastCounter || 0}</strong></p>
                <p>Starting number: <strong>{settings.startNumber || 1}</strong></p>
                {settings.resetOn !== 'never' && (
                  <p>Reset schedule: <strong>{settings.resetOn === 'month' ? 'Monthly' : 'Yearly'}</strong></p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Reset Counter Section */}
          <div className="p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <Label className="text-base font-semibold">Reset Counter</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manually reset the counter to start from a specific number. This will affect future invoice numbers.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={resetTo}
                onChange={(e) => setResetTo(e.target.value)}
                placeholder="Enter starting number"
                className="w-32"
              />
              <Button
                variant="destructive"
                onClick={handleResetCounter}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Counter
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

