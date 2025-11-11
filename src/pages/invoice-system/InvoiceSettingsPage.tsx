import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';

const InvoiceSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    companyName: '',
    companyEmail: '',
    companyAddress: '',
    companyPhone: '',
    taxId: '',
    currency: 'USD',
    invoicePrefix: 'INV',
    defaultPaymentTerms: 'Net 30',
    defaultNotes: '',
    autoNumbering: true,
    sendEmailNotifications: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement settings save API call
    console.log('Saving settings:', settings);
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Settings</h1>
          <p className="text-gray-600 mt-1">Configure your invoice system preferences</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Company Information */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Your company details will appear on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                      placeholder="company@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyAddress">Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                    placeholder="Company Address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={settings.taxId}
                    onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                    placeholder="Tax Identification Number"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Preferences */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Invoice Preferences</CardTitle>
                <CardDescription>Default settings for new invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      placeholder="USD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      value={settings.invoicePrefix}
                      onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                      placeholder="INV"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
                  <Input
                    id="defaultPaymentTerms"
                    value={settings.defaultPaymentTerms}
                    onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                    placeholder="Net 30"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultNotes">Default Notes</Label>
                  <Textarea
                    id="defaultNotes"
                    value={settings.defaultNotes}
                    onChange={(e) => setSettings({ ...settings, defaultNotes: e.target.value })}
                    placeholder="Default notes to include on invoices"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoNumbering">Auto Numbering</Label>
                    <p className="text-sm text-gray-500">Automatically generate invoice numbers</p>
                  </div>
                  <Switch
                    id="autoNumbering"
                    checked={settings.autoNumbering}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoNumbering: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sendEmailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email notifications for invoices</p>
                  </div>
                  <Switch
                    id="sendEmailNotifications"
                    checked={settings.sendEmailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, sendEmailNotifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceSettingsPage;

