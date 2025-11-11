import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Globe, Layout, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { boardAPI } from '@/lib/api';

interface FormDesignSettings {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  layout?: 'centered' | 'left' | 'right';
  showLogo?: boolean;
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  customCSS?: string;
}

interface FormSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  isPublic: boolean;
  formSettings?: FormDesignSettings;
  onSettingsChange?: () => void;
}

export const FormSettingsDialog: React.FC<FormSettingsDialogProps> = ({
  open,
  onOpenChange,
  boardId,
  isPublic: initialIsPublic,
  formSettings: initialFormSettings,
  onSettingsChange,
}) => {
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [formSettings, setFormSettings] = useState<FormDesignSettings>(initialFormSettings || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsPublic(initialIsPublic);
    setFormSettings(initialFormSettings || {});
  }, [initialIsPublic, initialFormSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Get current board to merge settings
      const currentBoardResponse = await boardAPI.getBoardById(boardId);
      const currentSettings = (currentBoardResponse.success && currentBoardResponse.data 
        ? (currentBoardResponse.data as any).settings 
        : {}) || {};

      // Update board public status and settings
      await boardAPI.updateBoard(boardId, {
        isPublic,
        settings: {
          ...currentSettings,
          formDesign: formSettings,
        },
      });

      toast({
        title: 'Success',
        description: 'Form settings saved successfully',
      });

      onSettingsChange?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving form settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save form settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Form Settings
          </DialogTitle>
          <DialogDescription>
            Configure your public form design and sharing options.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="public-form" className="text-base font-medium">
                  Public Form
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable public access to this form. Anyone with the link can submit items.
                </p>
              </div>
              <Switch
                id="public-form"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {isPublic && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">Public Form Enabled</p>
                    <p className="text-sm text-blue-800">
                      Your form is now accessible to anyone with the link. Share the form URL to allow public submissions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="design" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={formSettings.primaryColor || '#3b82f6'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formSettings.primaryColor || '#3b82f6'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-color">Button Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="button-color"
                    type="color"
                    value={formSettings.buttonColor || '#3b82f6'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, buttonColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formSettings.buttonColor || '#3b82f6'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, buttonColor: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bg-color"
                    type="color"
                    value={formSettings.backgroundColor || '#ffffff'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formSettings.backgroundColor || '#ffffff'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={formSettings.textColor || '#1f2937'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formSettings.textColor || '#1f2937'}
                    onChange={(e) => setFormSettings(prev => ({ ...prev, textColor: e.target.value }))}
                    placeholder="#1f2937"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="border-radius">Border Radius</Label>
              <Select
                value={formSettings.borderRadius || 'medium'}
                onValueChange={(value: 'none' | 'small' | 'medium' | 'large') =>
                  setFormSettings(prev => ({ ...prev, borderRadius: value }))
                }
              >
                <SelectTrigger id="border-radius">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (0px)</SelectItem>
                  <SelectItem value="small">Small (4px)</SelectItem>
                  <SelectItem value="medium">Medium (8px)</SelectItem>
                  <SelectItem value="large">Large (16px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={formSettings.layout || 'centered'}
                onValueChange={(value: 'centered' | 'left' | 'right') =>
                  setFormSettings(prev => ({ ...prev, layout: value }))
                }
              >
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centered">Centered</SelectItem>
                  <SelectItem value="left">Left Aligned</SelectItem>
                  <SelectItem value="right">Right Aligned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="header-text">Header Text</Label>
              <Input
                id="header-text"
                value={formSettings.headerText || ''}
                onChange={(e) => setFormSettings(prev => ({ ...prev, headerText: e.target.value }))}
                placeholder="Welcome to our form"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer-text">Footer Text</Label>
              <Input
                id="footer-text"
                value={formSettings.footerText || ''}
                onChange={(e) => setFormSettings(prev => ({ ...prev, footerText: e.target.value }))}
                placeholder="Thank you for your submission"
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL (optional)</Label>
              <Input
                id="logo-url"
                type="url"
                value={formSettings.logoUrl || ''}
                onChange={(e) => setFormSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-logo"
                checked={formSettings.showLogo || false}
                onCheckedChange={(checked) => setFormSettings(prev => ({ ...prev, showLogo: checked }))}
              />
              <Label htmlFor="show-logo">Show Logo</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-css">Custom CSS (optional)</Label>
              <textarea
                id="custom-css"
                value={formSettings.customCSS || ''}
                onChange={(e) => setFormSettings(prev => ({ ...prev, customCSS: e.target.value }))}
                placeholder=".form-container { ... }"
                className="w-full min-h-[200px] p-2 border rounded-md font-mono text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

