// Share dialog component for form view

import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ExternalLink, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface FormShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formUrl: string;
  boardName?: string;
}

export const FormShareDialog: React.FC<FormShareDialogProps> = ({
  open,
  onOpenChange,
  formUrl,
  boardName,
}) => {
  const { toast } = useToast();
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Please fill out: ${boardName || 'Form'}`);
  const [emailMessage, setEmailMessage] = useState(`Hi,\n\nPlease fill out this form: ${formUrl}`);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast({
      title: 'Copied',
      description: 'Form URL copied to clipboard',
    });
  };

  const handleOpenInNewTab = () => {
    window.open(formUrl, '_blank');
  };

  const handleEmailShare = () => {
    const recipients = emailRecipients.split(',').map(email => email.trim()).filter(Boolean);
    if (recipients.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter at least one email address',
        variant: 'destructive',
      });
      return;
    }

    const mailtoLink = `mailto:${recipients.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
    window.location.href = mailtoLink;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Form</DialogTitle>
          <DialogDescription>
            Share this form with others. Anyone with this link can submit items.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Form URL</Label>
              <div className="flex gap-2">
                <Input
                  value={formUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={handleCopyUrl} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">⚠️ Public Form</p>
              <p>This form is accessible to anyone with the link. Make sure you trust who you share it with.</p>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipients">Email Addresses (comma-separated)</Label>
              <Input
                id="email-recipients"
                type="text"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="user1@example.com, user2@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <Button onClick={handleEmailShare} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Open Email Client
            </Button>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
              <QRCodeSVG value={formUrl} size={256} level="H" />
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Scan this QR code to open the form
              </p>
            </div>
            <Button onClick={handleCopyUrl} variant="outline" className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

