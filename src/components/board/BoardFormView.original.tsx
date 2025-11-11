import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FileColumnUpload } from './FileColumnUpload';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Share2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  Star,
} from 'lucide-react';
import { boardAPI } from '@/lib/api';
import { Column, ColumnType } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BoardFormViewProps {
  boardId: string;
  columns?: Column[];
  onItemCreate?: () => void;
  onItemEdit?: (item: any) => void;
  onItemDelete?: (item: any) => void;
  onColumnsChange?: () => void;
}

export const BoardFormView: React.FC<BoardFormViewProps> = ({
  boardId,
  columns = [],
  onItemCreate,
  onItemEdit,
  onItemDelete,
  onColumnsChange,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [workspaceMembers, setWorkspaceMembers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await boardAPI.getBoardById(boardId);
        if (response.success && response.data) {
          const board = response.data as any;
          if (board.workspaceId) {
            setWorkspaceId(board.workspaceId);
          }
        }
      } catch (error) {
        console.error('Error fetching board:', error);
      }
    };
    if (boardId) {
      fetchBoard();
    }
  }, [boardId]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceId) return;
      try {
        const response = await workspaceAPI.getWorkspaceMembers(workspaceId);
        if (response.success && response.data) {
          const membersData = Array.isArray(response.data) ? response.data : [];
          const formattedMembers = membersData.map((member: Record<string, unknown>) => ({
            id: String(
              member.userId || 
              (member.user && typeof member.user === 'object' && 'id' in member.user ? member.user.id : '')
            ),
            name: String(
              member.user && typeof member.user === 'object' && 'name' in member.user
                ? member.user.name
                : member.email || 'Unknown'
            ),
            email: String(
              member.user && typeof member.user === 'object' && 'email' in member.user
                ? member.user.email
                : member.email || ''
            ),
            profilePicture: 
              member.user && typeof member.user === 'object' && 'profilePicture' in member.user
                ? String(member.user.profilePicture || '')
                : undefined,
          }));
          setWorkspaceMembers(formattedMembers);
        }
      } catch (error) {
        console.error('Error fetching workspace members:', error);
      }
    };
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  // Filter visible columns and sort by position
  const visibleColumns = columns
    .filter(col => !col.isHidden)
    .sort((a, b) => a.position - b.position);

  const handleFieldChange = (columnId: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [columnId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Build cells object from form data
      const cells: Record<string, unknown> = {};
      
      visibleColumns.forEach((column) => {
        const value = formData[column.id];
        
        if (value !== undefined && value !== null && value !== '') {
          // Handle date conversion
          if (column.type === 'DATE' || column.type === 'DATETIME') {
            if (typeof value === 'string') {
              const dateValue = new Date(value);
              cells[column.id] = dateValue.toISOString();
            }
          } else if (column.type === 'NUMBER' || column.type === 'CURRENCY' || column.type === 'PERCENTAGE' || column.type === 'RATING') {
            const numValue = typeof value === 'string' ? Number(value) : value;
            cells[column.id] = isNaN(Number(numValue)) ? value : numValue;
          } else if (column.type === 'AUTO_NUMBER') {
            // Skip AUTO_NUMBER - will be generated by backend
          } else {
            cells[column.id] = value;
          }
        } else if (column.defaultValue !== undefined && column.defaultValue !== null) {
          cells[column.id] = column.defaultValue;
        }
      });

      // Get item name from first TEXT column or use "New Item"
      let itemName = 'New Item';
      const nameColumn = visibleColumns.find(col => col.type === 'TEXT');
      if (nameColumn && formData[nameColumn.id]) {
        itemName = String(formData[nameColumn.id]);
      }

      const itemData = {
        name: itemName,
        cells: Object.keys(cells).length > 0 ? cells : undefined,
      };

      const response = await boardAPI.createItem(boardId, itemData);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Form submitted successfully',
        });
        setSubmitted(true);
        setFormData({});
        onItemCreate?.();
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
        }, 3000);
      } else {
        throw new Error(response.message || 'Failed to submit form');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit form',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generateFormUrl = () => {
    const url = `${window.location.origin}/forms/${boardId}`;
    setFormUrl(url);
    return url;
  };

  const handleShare = () => {
    const url = generateFormUrl();
    setShareDialogOpen(true);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast({
      title: 'Copied',
      description: 'Form URL copied to clipboard',
    });
  };

  const renderField = (column: Column) => {
    const value = formData[column.id];
    const isRequired = column.required;

    switch (column.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'LINK':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type={column.type === 'EMAIL' ? 'email' : column.type === 'PHONE' ? 'tel' : column.type === 'LINK' ? 'url' : 'text'}
              value={value as string || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={column.type === 'EMAIL' ? 'email@example.com' : column.type === 'PHONE' ? '+1 (555) 123-4567' : column.type === 'LINK' ? 'https://example.com' : `Enter ${column.name.toLowerCase()}`}
              required={isRequired}
            />
          </div>
        );

      case 'LONG_TEXT':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={column.id}
              value={value as string || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              rows={4}
              required={isRequired}
            />
          </div>
        );

      case 'NUMBER':
        const numberSettings = column.settings as { numberType?: 'integer' | 'decimal' } | undefined;
        const isInteger = numberSettings?.numberType === 'integer';
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type="number"
              step={isInteger ? '1' : '0.01'}
              value={value as number || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              required={isRequired}
            />
          </div>
        );

      case 'CURRENCY':
        const currencySettings = column.settings as { currency?: string } | undefined;
        const currency = currencySettings?.currency || 'USD';
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name} ({currency})
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type="number"
              step="0.01"
              value={value as number || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              required={isRequired}
            />
          </div>
        );

      case 'PERCENTAGE':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={column.id}
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={value as number || ''}
                onChange={(e) => handleFieldChange(column.id, e.target.value)}
                placeholder="0-100"
                className="pr-8"
                required={isRequired}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
        );

      case 'RATING':
        const ratingValue = value ? Math.min(5, Math.max(0, Number(value))) : 0;
        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-8 w-8 cursor-pointer transition-colors',
                    star <= ratingValue
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  )}
                  onClick={() => handleFieldChange(column.id, star)}
                />
              ))}
              {ratingValue > 0 && <span className="text-sm text-muted-foreground ml-2">({ratingValue}/5)</span>}
            </div>
          </div>
        );

      case 'AUTO_NUMBER':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              <span className="text-xs text-muted-foreground ml-2">(Auto-generated)</span>
            </Label>
            <Input
              id={column.id}
              type="text"
              value={value ? String(value) : 'Auto-generated'}
              disabled
              className="bg-muted"
            />
          </div>
        );

      case 'DATE':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type="date"
              value={value ? (typeof value === 'string' ? value.split('T')[0] : '') : ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              required={isRequired}
            />
          </div>
        );

      case 'DATETIME':
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type="datetime-local"
              value={value ? (typeof value === 'string' ? value.slice(0, 16) : '') : ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              required={isRequired}
            />
          </div>
        );

      case 'WEEK': {
        const weekValue = value ? (() => {
          const date = new Date(value as string);
          const year = date.getFullYear();
          // Get ISO week number
          const d = new Date(Date.UTC(year, date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
          return `${year}-W${String(week).padStart(2, '0')}`;
        })() : '';
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type="week"
              value={weekValue}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              required={isRequired}
            />
          </div>
        );
      }

      case 'MONTH': {
        const monthValue = value ? (() => {
          const date = new Date(value as string);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })() : '';
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type="month"
              value={monthValue}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              required={isRequired}
            />
          </div>
        );
      }

      case 'YEAR': {
        const yearValue = value ? (() => {
          const date = new Date(value as string);
          return String(date.getFullYear());
        })() : '';
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={column.id}
              type="number"
              min="1900"
              max="2100"
              placeholder="YYYY"
              value={yearValue}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              required={isRequired}
            />
          </div>
        );
      }

      case 'TIMELINE': {
        const timeline = value && typeof value === 'object' && 'start' in value && 'end' in value
          ? value as { start: string; end: string }
          : null;
        const startValue = timeline?.start ? new Date(timeline.start).toISOString().split('T')[0] : '';
        const endValue = timeline?.end ? new Date(timeline.end).toISOString().split('T')[0] : '';
        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor={`${column.id}_start`} className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id={`${column.id}_start`}
                  type="date"
                  value={startValue}
                  onChange={(e) => {
                    const updated = timeline ? { ...timeline, start: e.target.value ? new Date(e.target.value).toISOString() : '' } : { start: e.target.value ? new Date(e.target.value).toISOString() : '', end: '' };
                    handleFieldChange(column.id, updated);
                  }}
                  required={isRequired}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`${column.id}_end`} className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id={`${column.id}_end`}
                  type="date"
                  value={endValue}
                  onChange={(e) => {
                    const updated = timeline ? { ...timeline, end: e.target.value ? new Date(e.target.value).toISOString() : '' } : { start: '', end: e.target.value ? new Date(e.target.value).toISOString() : '' };
                    handleFieldChange(column.id, updated);
                  }}
                  required={isRequired}
                />
              </div>
            </div>
          </div>
        );
      }

      case 'CHECKBOX':
        return (
          <div key={column.id} className="flex items-center space-x-2">
            <Checkbox
              id={column.id}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleFieldChange(column.id, checked)}
            />
            <Label htmlFor={column.id} className="cursor-pointer">
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case 'DROPDOWN':
      case 'STATUS':
        const options = (column.settings as { options?: string[] })?.options || [];
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={value as string || ''}
              onValueChange={(val) => handleFieldChange(column.id, val)}
              required={isRequired}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${column.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'RADIO': {
        const radioOptions = (column.settings as { options?: string[] })?.options || [];
        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value as string || ''}
              onValueChange={(val) => handleFieldChange(column.id, val)}
              className="space-y-2"
            >
              {radioOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`radio-${column.id}-${option}`} />
                  <Label htmlFor={`radio-${column.id}-${option}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      }

      case 'PEOPLE': {
        const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
        const isMultiple = peopleSettings?.peopleType === 'multiple';
        const currentValue = value;
        const userIds = Array.isArray(currentValue) 
          ? currentValue.map(id => String(id))
          : currentValue 
          ? [String(currentValue)]
          : [];

        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            {isMultiple ? (
              <div className="space-y-2">
                <Select
                  value=""
                  onValueChange={(val) => {
                    const newValues = userIds.includes(val)
                      ? userIds.filter(id => id !== val)
                      : [...userIds, val];
                    handleFieldChange(column.id, newValues);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`${userIds.length} selected`} />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaceMembers.map((member) => {
                      const isSelected = userIds.includes(member.id);
                      return (
                        <SelectItem key={member.id} value={member.id} className={isSelected ? 'bg-blue-50' : ''}>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSelected} />
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.profilePicture} />
                              <AvatarFallback className="text-xs">
                                {member.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {userIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {workspaceMembers.filter(m => userIds.includes(m.id)).map((user) => (
                      <div key={user.id} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{user.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Select
                value={value as string || ''}
                onValueChange={(val) => handleFieldChange(column.id, val)}
                required={isRequired}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {workspaceMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.profilePicture} />
                          <AvatarFallback className="text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      }

      case 'FILE': {
        const fileSettings = column.settings as { fileType?: 'single' | 'multiple'; allowedFileTypes?: string[]; maxFileSize?: number } | undefined;
        const isMultiple = fileSettings?.fileType === 'multiple';
        const allowedFileTypes = fileSettings?.allowedFileTypes || [];
        const maxFileSize = fileSettings?.maxFileSize || 5;

        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <p className="text-sm text-muted-foreground">
              Files will be uploaded after form submission
            </p>
            {/* Note: File upload for forms requires itemId which is created after submission */}
          </div>
        );
      }

      case 'MULTI_SELECT':
        const multiOptions = (column.settings as { options?: string[] })?.options || [];
        const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
        return (
          <div key={column.id} className="space-y-2">
            <Label>
              {column.name}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex flex-wrap gap-2">
              {multiOptions.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <Badge
                    key={option}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter(v => v !== option)
                        : [...selectedValues, option];
                      handleFieldChange(column.id, newValues);
                    }}
                  >
                    {option}
                  </Badge>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div key={column.id} className="space-y-2">
            <Label htmlFor={column.id}>{column.name}</Label>
            <Input
              id={column.id}
              value={value as string || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Enter ${column.name.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  if (visibleColumns.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Columns Available</h3>
          <p className="text-muted-foreground mb-4">
            Add columns to this board to create a form.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Public Form View
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Form
              </Button>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Public Form</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Form Submitted Successfully!</h3>
              <p className="text-muted-foreground mb-4">
                Thank you for your submission. The form will reset shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              {visibleColumns.map((column) => renderField(column))}

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({})}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Form</DialogTitle>
            <DialogDescription>
              Share this form link with others. Anyone with this link can submit the form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Form URL</Label>
              <div className="flex gap-2">
                <Input value={formUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" onClick={handleCopyUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(formUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">⚠️ Public Form</p>
              <p>This form is accessible to anyone with the link. Make sure you trust who you share it with.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

