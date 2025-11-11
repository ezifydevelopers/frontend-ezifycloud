// Invoice Description Generator - AI-powered description generation for invoices
import React from 'react';
import { AITextGenerator } from '@/components/ai/AITextGenerator';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface InvoiceDescriptionGeneratorProps {
  lineItems?: Array<{
    name?: string;
    description?: string;
    quantity?: number;
    price?: number;
    unitPrice?: number;
  }>;
  category?: string;
  itemName?: string;
  existingDescription?: string;
  onGenerated?: (text: string) => void;
  mode?: 'generate' | 'suggest' | 'improve';
}

export const InvoiceDescriptionGenerator: React.FC<InvoiceDescriptionGeneratorProps> = ({
  lineItems = [],
  category,
  itemName,
  existingDescription,
  onGenerated,
  mode = 'generate',
}) => {
  return (
    <div className="flex items-center gap-2">
      <AITextGenerator
        type="description"
        context={{
          itemName,
          lineItems,
          category,
          existingText: existingDescription,
          mode,
        }}
        onGenerated={onGenerated}
        trigger={
          <Button variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            {mode === 'improve' ? 'Improve Description' : 
             mode === 'suggest' ? 'Suggest Description' : 
             'Generate Description'}
          </Button>
        }
      />
      {lineItems.length > 0 && (
        <span className="text-xs text-muted-foreground">
          From {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

