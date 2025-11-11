// Line Items Editor Component - Manage invoice line items

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  total: number;
}

interface LineItemsEditorProps {
  value: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: string;
  readOnly?: boolean;
}

export const LineItemsEditor: React.FC<LineItemsEditorProps> = ({
  value = [],
  onChange,
  currency = 'USD',
  readOnly = false,
}) => {
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'CHF',
    NZD: 'NZ$', BRL: 'R$', MXN: '$', ZAR: 'R',
  };
  const symbol = currencySymbols[currency] || currency;

  const calculateLineTotal = (item: Partial<LineItem>): number => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const subtotal = quantity * unitPrice;
    const tax = item.tax || 0;
    return subtotal + tax;
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      tax: 0,
      total: 0,
    };
    setEditingItem(newItem);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: LineItem) => {
    setEditingItem({ ...item });
    setIsDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!editingItem) return;

    const total = calculateLineTotal(editingItem);
    const updatedItem = { ...editingItem, total };

    if (value.find(item => item.id === editingItem.id)) {
      // Update existing item
      onChange(value.map(item => item.id === editingItem.id ? updatedItem : item));
    } else {
      // Add new item
      onChange([...value, updatedItem]);
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  const calculateSubtotal = (): number => {
    return value.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Line Items</Label>
        {!readOnly && (
          <Button type="button" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>

      {value.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <p>No line items added yet.</p>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="w-[15%] text-right">Quantity</TableHead>
                  <TableHead className="w-[15%] text-right">Unit Price</TableHead>
                  <TableHead className="w-[15%] text-right">Tax</TableHead>
                  <TableHead className="w-[15%] text-right">Total</TableHead>
                  {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell>{item.description || '—'}</TableCell>
                    <TableCell className="text-right">{item.quantity || 0}</TableCell>
                    <TableCell className="text-right">
                      {symbol}{item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right">
                      {symbol}{item.tax?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {symbol}{item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-[300px] space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {symbol}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem?.id && value.find(i => i.id === editingItem.id) ? 'Edit Line Item' : 'Add Line Item'}</DialogTitle>
            <DialogDescription>
              Enter the details for this line item
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Item description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItem.quantity}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value) || 0;
                      const total = calculateLineTotal({ ...editingItem, quantity: qty });
                      setEditingItem({ ...editingItem, quantity: qty, total });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price ({currency}) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItem.unitPrice}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const total = calculateLineTotal({ ...editingItem, unitPrice: price });
                      setEditingItem({ ...editingItem, unitPrice: price, total });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Tax ({currency})</Label>
                <Input
                  id="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingItem.tax || 0}
                  onChange={(e) => {
                    const tax = parseFloat(e.target.value) || 0;
                    const total = calculateLineTotal({ ...editingItem, tax });
                    setEditingItem({ ...editingItem, tax, total });
                  }}
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Line Total:</span>
                  <span className="text-lg font-bold">
                    {symbol}{editingItem.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveItem} disabled={!editingItem.description || editingItem.quantity <= 0 || editingItem.unitPrice < 0}>
                  Save Item
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

