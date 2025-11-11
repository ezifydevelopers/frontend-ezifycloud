import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Wand2, CheckCircle2 } from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AITextGeneratorProps {
  type: 'description' | 'comment' | 'email' | 'summary';
  context?: {
    itemName?: string;
    itemData?: Record<string, unknown>;
    columnValues?: Record<string, unknown>;
    existingText?: string;
    lineItems?: Array<{ 
      name?: string;
      description?: string;
      quantity?: number; 
      price?: number;
      unitPrice?: number;
    }>;
    category?: string;
    recipientEmail?: string;
    recipientName?: string;
    tone?: 'professional' | 'friendly' | 'formal' | 'casual';
    previousComments?: Array<{ 
      content: string; 
      author?: string;
      user?: { name: string; email?: string };
    }>;
    mode?: 'generate' | 'suggest' | 'improve' | 'reply' | 'summarize';
  };
  onGenerated?: (text: string) => void;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  showModeSelector?: boolean;
}

export const AITextGenerator: React.FC<AITextGeneratorProps> = ({
  type,
  context = {},
  onGenerated,
  trigger,
  defaultOpen = false,
  showModeSelector = true,
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal' | 'casual'>(
    context.tone || 'professional'
  );
  const [mode, setMode] = useState<'generate' | 'suggest' | 'improve' | 'reply' | 'summarize'>(
    context.mode || (type === 'description' ? 'generate' : 'suggest')
  );
  const [confidence, setConfidence] = useState<number | null>(null);

  const typeLabels = {
    description: 'Generate Description',
    comment: 'Suggest Comment',
    email: 'Draft Email',
    summary: 'Generate Summary',
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setGeneratedText('');

      const response = await aiAPI.generateText({
        type,
        context: {
          ...context,
          tone,
          mode,
        },
      });

      if (response.success && response.data) {
        setGeneratedText(response.data.text);
        setConfidence(response.data.confidence || null);
        
        toast({
          title: 'Success',
          description: `${typeLabels[type]} generated`,
        });
      } else {
        throw new Error(response.message || 'Failed to generate text');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate text',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUse = () => {
    if (generatedText) {
      onGenerated?.(generatedText);
      setOpen(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            {typeLabels[type]}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            {typeLabels[type]}
          </DialogTitle>
          <DialogDescription>
            AI-powered {type} generation. Configure settings and generate content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selector */}
          {showModeSelector && (type === 'description' || type === 'comment') && (
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select 
                value={mode} 
                onValueChange={(value: typeof mode) => setMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'description' ? (
                    <>
                      <SelectItem value="generate">Auto-generate from Line Items</SelectItem>
                      <SelectItem value="suggest">Suggest based on Category</SelectItem>
                      <SelectItem value="improve">Improve Existing Description</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="suggest">Suggest based on Changes</SelectItem>
                      <SelectItem value="reply">Auto-reply Suggestion</SelectItem>
                      <SelectItem value="summarize">Summarize Discussion</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Options */}
          {(type === 'email' || type === 'comment') && (
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(value: typeof tone) => setTone(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Context display */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2">
            {context.itemName && (
              <p className="font-medium mb-1">Context:</p>
            )}
            {context.itemName && (
              <p className="text-muted-foreground">Item: {context.itemName}</p>
            )}
            {context.category && (
              <p className="text-muted-foreground">Category: {context.category}</p>
            )}
            {type === 'description' && context.lineItems && context.lineItems.length > 0 && (
              <div className="mt-2">
                <p className="font-medium mb-1">Line Items:</p>
                <ul className="text-muted-foreground space-y-1">
                  {context.lineItems.slice(0, 3).map((li, idx) => (
                    <li key={idx}>
                      • {li.name || li.description || 'Item'} 
                      {li.quantity && ` (Qty: ${li.quantity})`}
                      {(li.price || li.unitPrice) && ` - $${li.price || li.unitPrice}`}
                    </li>
                  ))}
                  {context.lineItems.length > 3 && (
                    <li className="text-xs">...and {context.lineItems.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            {context.existingText && (
              <div className="mt-2">
                <p className="font-medium mb-1">Existing Text:</p>
                <p className="text-muted-foreground text-xs">{context.existingText.substring(0, 150)}{context.existingText.length > 150 ? '...' : ''}</p>
              </div>
            )}
            {type === 'comment' && context.previousComments && context.previousComments.length > 0 && (
              <div className="mt-2">
                <p className="font-medium mb-1">Previous Comments ({context.previousComments.length}):</p>
                <p className="text-muted-foreground text-xs">
                  {mode === 'reply' ? 'Replying to latest comment' : 
                   mode === 'summarize' ? 'Summarizing all comments' : 
                   'Using context from recent comments'}
                </p>
              </div>
            )}
          </div>

          {/* Generated text */}
          {generatedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Text</Label>
                {confidence !== null && (
                  <Badge variant="outline" className={cn(
                    confidence > 0.8 ? 'bg-green-100 text-green-800' :
                    confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    Confidence: {Math.round(confidence * 100)}%
                  </Badge>
                )}
              </div>
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          )}

          {!generatedText && !generating && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Generate" to create {type} content</p>
            </div>
          )}

          {generating && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-600 mb-4" />
              <p className="text-muted-foreground">AI is generating your content...</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {generatedText && (
                <>
                  <Button variant="outline" onClick={handleCopy}>
                    Copy
                  </Button>
                  <Button onClick={handleUse}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Use This Text
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {generatedText ? 'Close' : 'Cancel'}
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

