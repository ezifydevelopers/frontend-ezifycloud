// Invoice Template Builder Component - Create and edit invoice templates

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Image as ImageIcon, Save, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InvoiceTemplate, InvoiceTemplateConfig, DEFAULT_INVOICE_TEMPLATE_CONFIG } from '@/types/invoice';
import { fileAPI, invoiceTemplateAPI } from '@/lib/api';

interface InvoiceTemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: InvoiceTemplate | null;
  workspaceId?: string;
  onSuccess?: (template: InvoiceTemplate) => void;
}

export const InvoiceTemplateBuilder: React.FC<InvoiceTemplateBuilderProps> = ({
  open,
  onOpenChange,
  template,
  workspaceId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [config, setConfig] = useState<InvoiceTemplateConfig>(
    template?.config || DEFAULT_INVOICE_TEMPLATE_CONFIG
  );

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setConfig(template.config);
    } else {
      setTemplateName('');
      setTemplateDescription('');
      setConfig(DEFAULT_INVOICE_TEMPLATE_CONFIG);
    }
  }, [template, open]);

  const handleLogoUpload = async (file: File) => {
    try {
      setLoading(true);
      // Convert file to base64 for upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const response = await fileAPI.uploadFile({
          itemId: 'template-logo', // Temporary ID for template logo
          fileName: file.name,
          fileData: base64String,
          mimeType: file.type,
          fileSize: file.size,
        });
        
        if (response.success && response.data) {
          const fileData = response.data as any;
          // Get file URL (adjust based on your file API response structure)
          const logoUrl = fileData.url || fileData.path || `/api/files/${fileData.id}/preview`;
          
          setConfig({
            ...config,
            header: {
              ...config.header,
              logoUrl,
              showLogo: true,
            },
          });
          toast({
            title: 'Success',
            description: 'Logo uploaded successfully',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      let response;
      if (template) {
        response = await invoiceTemplateAPI.updateTemplate(template.id, {
          name: templateName,
          description: templateDescription,
          config,
        });
      } else {
        response = await invoiceTemplateAPI.createTemplate({
          name: templateName,
          description: templateDescription,
          config,
          workspaceId,
        });
      }
      
      toast({
        title: 'Success',
        description: 'Template saved successfully',
      });
      
      const savedTemplate: InvoiceTemplate = {
        id: template?.id || `temp-${Date.now()}`,
        name: templateName,
        description: templateDescription,
        isDefault: false,
        workspaceId,
        createdBy: '', // Will be set by backend
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        config,
      };
      
      onSuccess?.(savedTemplate);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Invoice Template' : 'Create Invoice Template'}
          </DialogTitle>
          <DialogDescription>
            Design your invoice template with custom branding, company information, and layout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Professional Invoice Template"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of this template"
                rows={2}
              />
            </div>
          </div>

          {/* Template Configuration Tabs */}
          <Tabs defaultValue="header" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="company">Company Info</TabsTrigger>
              <TabsTrigger value="invoice">Invoice Details</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
            </TabsList>

            {/* Header Section */}
            <TabsContent value="header" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Header Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showLogo"
                      checked={config.header.showLogo}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          header: { ...config.header, showLogo: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="showLogo">Show Logo</Label>
                  </div>

                  {config.header.showLogo && (
                    <div className="space-y-2">
                      <Label>Upload Logo</Label>
                      <div className="flex items-center gap-4">
                        {config.header.logoUrl && (
                          <img
                            src={config.header.logoUrl}
                            alt="Logo"
                            className="h-20 w-auto object-contain border rounded"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoUpload(file);
                            }}
                            className="hidden"
                            id="logo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                            disabled={loading}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {config.header.logoUrl ? 'Change Logo' : 'Upload Logo'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="logoPosition">Logo Position</Label>
                    <Select
                      value={config.header.logoPosition}
                      onValueChange={(value: 'left' | 'center' | 'right') =>
                        setConfig({
                          ...config,
                          header: { ...config.header, logoPosition: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={config.header.companyName}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          header: { ...config.header, companyName: e.target.value },
                        })
                      }
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyTagline">Company Tagline</Label>
                    <Input
                      id="companyTagline"
                      value={config.header.companyTagline}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          header: { ...config.header, companyTagline: e.target.value },
                        })
                      }
                      placeholder="Your company tagline or slogan"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Information */}
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={config.companyInfo.name}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, name: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={config.companyInfo.taxId}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, taxId: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={config.companyInfo.address}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          companyInfo: { ...config.companyInfo, address: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={config.companyInfo.city}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, city: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={config.companyInfo.state}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, state: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={config.companyInfo.zipCode}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, zipCode: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={config.companyInfo.phone}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, phone: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={config.companyInfo.email}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, email: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={config.companyInfo.website}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, website: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">Registration Number</Label>
                      <Input
                        id="registrationNumber"
                        value={config.companyInfo.registrationNumber}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            companyInfo: { ...config.companyInfo, registrationNumber: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoice Details */}
            <TabsContent value="invoice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showInvoiceNumber"
                        checked={config.invoiceDetails.showInvoiceNumber}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            invoiceDetails: { ...config.invoiceDetails, showInvoiceNumber: checked as boolean },
                          })
                        }
                      />
                      <Label htmlFor="showInvoiceNumber">Show Invoice Number</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showInvoiceDate"
                        checked={config.invoiceDetails.showInvoiceDate}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            invoiceDetails: { ...config.invoiceDetails, showInvoiceDate: checked as boolean },
                          })
                        }
                      />
                      <Label htmlFor="showInvoiceDate">Show Invoice Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showDueDate"
                        checked={config.invoiceDetails.showDueDate}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            invoiceDetails: { ...config.invoiceDetails, showDueDate: checked as boolean },
                          })
                        }
                      />
                      <Label htmlFor="showDueDate">Show Due Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showStatus"
                        checked={config.invoiceDetails.showStatus}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            invoiceDetails: { ...config.invoiceDetails, showStatus: checked as boolean },
                          })
                        }
                      />
                      <Label htmlFor="showStatus">Show Status</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Section */}
            <TabsContent value="footer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Footer & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showTerms"
                      checked={config.footer.showTerms}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          footer: { ...config.footer, showTerms: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="showTerms">Show Terms & Conditions</Label>
                  </div>

                  {config.footer.showTerms && (
                    <div className="space-y-2">
                      <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                      <Textarea
                        id="termsAndConditions"
                        value={config.footer.termsAndConditions}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            footer: { ...config.footer, termsAndConditions: e.target.value },
                          })
                        }
                        placeholder="Enter your terms and conditions..."
                        rows={6}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showNotes"
                      checked={config.footer.showNotes}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          footer: { ...config.footer, showNotes: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="showNotes">Show Notes Section</Label>
                  </div>

                  {config.footer.showNotes && (
                    <div className="space-y-2">
                      <Label htmlFor="notesLabel">Notes Label</Label>
                      <Input
                        id="notesLabel"
                        value={config.footer.notesLabel}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            footer: { ...config.footer, notesLabel: e.target.value },
                          })
                        }
                        placeholder="Notes"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPaymentInfo"
                      checked={config.footer.showPaymentInfo}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          footer: { ...config.footer, showPaymentInfo: checked as boolean },
                        })
                      }
                    />
                    <Label htmlFor="showPaymentInfo">Show Payment Information</Label>
                  </div>

                  {config.footer.showPaymentInfo && (
                    <div className="space-y-2">
                      <Label htmlFor="paymentInfo">Payment Information</Label>
                      <Textarea
                        id="paymentInfo"
                        value={config.footer.paymentInfo}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            footer: { ...config.footer, paymentInfo: e.target.value },
                          })
                        }
                        placeholder="Enter payment instructions..."
                        rows={4}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Styling */}
            <TabsContent value="styling" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Styling & Formatting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={config.styling.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              styling: { ...config.styling, primaryColor: e.target.value },
                            })
                          }
                          className="w-20"
                        />
                        <Input
                          value={config.styling.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              styling: { ...config.styling, primaryColor: e.target.value },
                            })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Select
                        value={config.styling.fontSize}
                        onValueChange={(value: 'small' | 'medium' | 'large') =>
                          setConfig({
                            ...config,
                            styling: { ...config.styling, fontSize: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={config.styling.currency}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            styling: { ...config.styling, currency: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={config.styling.dateFormat}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            styling: { ...config.styling, dateFormat: value },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

