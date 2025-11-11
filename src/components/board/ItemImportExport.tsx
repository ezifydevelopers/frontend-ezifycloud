import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { boardAPI } from '@/lib/api';
import { Item, Column } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';

interface ItemImportExportProps {
  boardId: string;
  items: Item[];
  columns: Column[];
  onImportComplete?: () => void;
}

export const ItemImportExport: React.FC<ItemImportExportProps> = ({
  boardId,
  items,
  columns,
  onImportComplete,
}) => {
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<'csv' | 'excel'>('csv');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);

      // Filter visible columns
      const visibleColumns = columns.filter(col => !col.isHidden);
      
      // Prepare CSV/Excel data
      const headers = ['Name', 'Status', ...visibleColumns.map(col => col.name)];
      
      const rows = items.map(item => {
        const row: string[] = [
          item.name || '',
          item.status || '',
          ...visibleColumns.map(col => {
            const cell = item.cells?.[col.id];
            if (!cell) return '';
            
            const value = typeof cell === 'object' && 'value' in cell ? cell.value : cell;
            
            // Format based on column type
            if (col.type === 'DATE' || col.type === 'DATETIME') {
              return value ? new Date(value as string).toLocaleString() : '';
            }
            if (col.type === 'CHECKBOX') {
              return value ? 'Yes' : 'No';
            }
            if (Array.isArray(value)) {
              return value.join('; ');
            }
            
            return String(value || '');
          }),
        ];
        return row;
      });

      if (format === 'csv') {
        // Generate CSV
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `board-items-${boardId}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Items exported to CSV successfully',
        });
      } else {
        // For Excel, we would need a library like xlsx
        // For now, show a message
        toast({
          title: 'Excel Export',
          description: 'Excel export requires additional library. CSV export is available.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export items',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to import',
        variant: 'destructive',
      });
      return;
    }

    try {
      setImporting(true);

      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('File must have at least a header row and one data row');
      }

      // Parse CSV
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      const visibleColumns = columns.filter(col => !col.isHidden);

      // Map headers to columns (skip 'Name' and 'Status' as they're first)
      const columnMap: Record<number, Column | 'name' | 'status'> = {};
      headers.forEach((header, index) => {
        if (header.toLowerCase() === 'name') {
          columnMap[index] = 'name';
        } else if (header.toLowerCase() === 'status') {
          columnMap[index] = 'status';
        } else {
          const column = visibleColumns.find(col => col.name === header);
          if (column) {
            columnMap[index] = column;
          }
        }
      });

      // Parse rows and create items in batches
      let successCount = 0;
      let errorCount = 0;
      const batchSize = 10; // Create items in batches to avoid overwhelming the server

      for (let i = 1; i < lines.length; i += batchSize) {
        const batch = lines.slice(i, i + batchSize);
        const batchPromises = batch.map(async (line, batchIndex) => {
          const rowIndex = i + batchIndex;
          try {
            const values = parseCSVLine(line);
            if (values.length === 0 || values.every(v => !v.trim())) return null;

            const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
            const name = nameIndex >= 0 && values[nameIndex] ? values[nameIndex].trim() : `Imported Item ${rowIndex}`;
            
            if (!name) return null;

            const cells: Record<string, unknown> = {};
            
            headers.forEach((header, index) => {
              const value = values[index]?.trim();
              if (!value) return;

              const mapped = columnMap[index];
              if (mapped === 'name' || mapped === 'status') return;
              
              if (mapped && typeof mapped !== 'string') {
                const column = mapped as Column;
                
                // Convert value based on column type
                if (column.type === 'NUMBER' || column.type === 'CURRENCY' || column.type === 'PERCENTAGE') {
                  const num = Number(value);
                  if (!isNaN(num)) {
                    cells[column.id] = num;
                  }
                } else if (column.type === 'DATE' || column.type === 'DATETIME' || column.type === 'WEEK' || column.type === 'MONTH' || column.type === 'YEAR') {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    cells[column.id] = date.toISOString();
                  }
                } else if (column.type === 'CHECKBOX') {
                  cells[column.id] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value.toLowerCase() === '1';
                } else if (column.type === 'MULTI_SELECT') {
                  cells[column.id] = value.split(';').map(v => v.trim()).filter(Boolean);
                } else if (column.type === 'PEOPLE') {
                  const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
                  if (peopleSettings?.peopleType === 'multiple') {
                    cells[column.id] = value.split(';').map(v => v.trim()).filter(Boolean);
                  } else {
                    cells[column.id] = value;
                  }
                } else {
                  cells[column.id] = value;
                }
              }
            });

            const statusIndex = headers.findIndex(h => h.toLowerCase() === 'status');
            const status = statusIndex >= 0 && values[statusIndex] ? values[statusIndex].trim() : undefined;

            await boardAPI.createItem(boardId, {
              name,
              status,
              cells: Object.keys(cells).length > 0 ? cells : undefined,
            });

            return { success: true };
          } catch (error) {
            console.error(`Error importing row ${rowIndex}:`, error);
            return { success: false, error };
          }
        });

        const results = await Promise.all(batchPromises);
        results.forEach(result => {
          if (result?.success) {
            successCount++;
          } else if (result !== null) {
            errorCount++;
          }
        });
      }

      toast({
        title: 'Import Complete',
        description: `Imported ${successCount} items${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      });

      setImportDialogOpen(false);
      setImportFile(null);
      onImportComplete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import items',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          disabled={exporting || items.length === 0}
        >
          {exporting ? (
            'Exporting...'
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('excel')}
          disabled={exporting || items.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Import */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Items</DialogTitle>
            <DialogDescription>
              Import items from a CSV or Excel file. The first row should contain column headers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>File Format</Label>
              <Select value={importFormat} onValueChange={(value: 'csv' | 'excel') => setImportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input
                type="file"
                accept={importFormat === 'csv' ? '.csv' : '.xlsx,.xls'}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Import Format:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>First row must contain column headers (Name, Status, and column names)</li>
                <li>Date columns should be in ISO format or standard date format</li>
                <li>Multi-select values should be separated by semicolons (;)</li>
                <li>Checkbox values should be "Yes"/"No" or "true"/"false"</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing || !importFile}>
              {importing ? 'Importing...' : 'Import Items'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

