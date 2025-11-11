// Simplified form field renderer for public forms - doesn't use react-hook-form

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import { Column } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface SimpleFormFieldRendererProps {
  column: Column;
  value: unknown;
  onChange: (value: unknown) => void;
  workspaceMembers: Array<{ id: string; name: string; email: string; profilePicture?: string }>;
}

export const SimpleFormFieldRenderer: React.FC<SimpleFormFieldRendererProps> = ({
  column,
  value,
  onChange,
  workspaceMembers,
}) => {
  const isRequired = column.required;

  const getDisplayValue = () => {
    if (value === null || value === undefined) return '';
    if (column.type === 'DATE' && typeof value === 'string') {
      return value.split('T')[0];
    }
    return String(value);
  };

  switch (column.type) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'LINK':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            type={column.type === 'EMAIL' ? 'email' : column.type === 'PHONE' ? 'tel' : column.type === 'LINK' ? 'url' : 'text'}
            value={getDisplayValue()}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.type === 'EMAIL' ? 'email@example.com' : column.type === 'PHONE' ? '+1 (555) 123-4567' : column.type === 'LINK' ? 'https://example.com' : `Enter ${column.name.toLowerCase()}`}
            required={isRequired}
          />
        </div>
      );

    case 'LONG_TEXT':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Textarea
            id={column.id}
            value={getDisplayValue()}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${column.name.toLowerCase()}`}
            rows={4}
            required={isRequired}
          />
        </div>
      );

    case 'NUMBER': {
      const numberSettings = column.settings as { numberType?: 'integer' | 'decimal' } | undefined;
      const isInteger = numberSettings?.numberType === 'integer';
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            type="number"
            step={isInteger ? '1' : '0.01'}
            value={value as number || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={`Enter ${column.name.toLowerCase()}`}
            required={isRequired}
          />
        </div>
      );
    }

    case 'CURRENCY': {
      const currencySettings = column.settings as { currency?: string } | undefined;
      const currency = currencySettings?.currency || 'USD';
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id}>
            {column.name} ({currency})
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={column.id}
            type="number"
            step="0.01"
            value={value as number || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={`Enter ${column.name.toLowerCase()}`}
            required={isRequired}
          />
        </div>
      );
    }

    case 'PERCENTAGE':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <div className="relative">
            <Input
              id={column.id}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={value as number || ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
              placeholder="0-100"
              className="pr-8"
              required={isRequired}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        </div>
      );

    case 'RATING': {
      const ratingValue = value ? Math.min(5, Math.max(0, Number(value))) : 0;
      return (
        <div className="space-y-2">
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
                onClick={() => onChange(star)}
              />
            ))}
            {ratingValue > 0 && <span className="text-sm text-muted-foreground ml-2">({ratingValue}/5)</span>}
          </div>
        </div>
      );
    }

    case 'AUTO_NUMBER':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id}>
            {column.name}
            <span className="text-xs text-muted-foreground ml-2">(Auto-generated)</span>
          </Label>
          <Input
            id={column.id}
            type="text"
            value="Auto-generated"
            disabled
            className="bg-muted"
          />
        </div>
      );

    case 'DATE':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            type="date"
            value={getDisplayValue()}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
          />
        </div>
      );

    case 'DATETIME':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            type="datetime-local"
            value={getDisplayValue()}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
          />
        </div>
      );

    case 'WEEK':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            type="week"
            value={getDisplayValue()}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
          />
        </div>
      );

    case 'MONTH':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            type="month"
            value={getDisplayValue()}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
          />
        </div>
      );

    case 'YEAR':
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            type="number"
            min="1900"
            max="2100"
            value={value as number || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            placeholder="YYYY"
            required={isRequired}
          />
        </div>
      );

    case 'TIMELINE': {
      let startDate = '';
      let endDate = '';
      if (value) {
        try {
          const timeline = typeof value === 'string' ? JSON.parse(value) : value;
          if (timeline.start) {
            const date = new Date(timeline.start);
            startDate = date.toISOString().split('T')[0];
          }
          if (timeline.end) {
            const date = new Date(timeline.end);
            endDate = date.toISOString().split('T')[0];
          }
        } catch {
          // Invalid format
        }
      }
      return (
        <div className="space-y-2">
          <Label>
            {column.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                const timeline = typeof value === 'string' && value ? JSON.parse(value) : (value || {});
                timeline.start = e.target.value ? new Date(e.target.value).toISOString() : '';
                onChange(JSON.stringify(timeline));
              }}
              placeholder="Start date"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                const timeline = typeof value === 'string' && value ? JSON.parse(value) : (value || {});
                timeline.end = e.target.value ? new Date(e.target.value).toISOString() : '';
                onChange(JSON.stringify(timeline));
              }}
              placeholder="End date"
            />
          </div>
        </div>
      );
    }

    case 'CHECKBOX':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={column.id}
            checked={value as boolean || false}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label htmlFor={column.id} className="cursor-pointer">
            {column.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      );

    case 'DROPDOWN':
    case 'STATUS': {
      const options = (column.settings as { options?: string[] })?.options || [];
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Select
            value={value as string || ''}
            onValueChange={(val) => onChange(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${column.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options
                .filter(option => option && option.trim() !== '') // Filter out empty options
                .map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case 'RADIO': {
      const options = (column.settings as { options?: string[] })?.options || [];
      return (
        <div className="space-y-2">
          <Label>
            {column.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <RadioGroup value={value as string || ''} onValueChange={onChange}>
            {options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${column.id}_${option}`} />
                <Label htmlFor={`${column.id}_${option}`} className="cursor-pointer font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    case 'MULTI_SELECT': {
      const options = (column.settings as { options?: string[] })?.options || [];
      const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
      return (
        <div className="space-y-2">
          <Label>
            {column.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${column.id}_${option}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selectedValues, option]);
                      } else {
                        onChange(selectedValues.filter((v: string) => v !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${column.id}_${option}`} className="cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'PEOPLE': {
      const peopleSettings = column.settings as { peopleType?: 'single' | 'multiple' } | undefined;
      const isMultiple = peopleSettings?.peopleType === 'multiple';
      const selectedIds = isMultiple
        ? (Array.isArray(value) ? value : value ? [value] : [])
        : value ? [value] : [];
      
      const selectedMembers = workspaceMembers.filter(m => selectedIds.includes(m.id));

      return (
        <div className="space-y-2">
          <Label>
            {column.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={isMultiple ? '' : (value as string || '')}
            onValueChange={(val) => {
              if (isMultiple) {
                const current = Array.isArray(value) ? value : value ? [value] : [];
                if (current.includes(val)) {
                  onChange(current.filter((id: string) => id !== val));
                } else {
                  onChange([...current, val]);
                }
              } else {
                onChange(val);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={isMultiple ? `${selectedIds.length} selected` : 'Select person'} />
            </SelectTrigger>
            <SelectContent>
              {workspaceMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                return (
                  <SelectItem key={member.id} value={member.id} className={isSelected && isMultiple ? 'bg-blue-50' : ''}>
                    <div className="flex items-center gap-2">
                      {isMultiple && <Checkbox checked={isSelected} />}
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
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedMembers.map((user) => (
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
      );
    }

    case 'FILE':
      return (
        <div className="space-y-2">
          <Label>
            {column.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <p className="text-sm text-muted-foreground">
            Files will be uploaded after form submission
          </p>
        </div>
      );

    case 'VOTE': {
      const currentVote = value === 'up' ? 'up' : value === 'down' ? 'down' : null;
      return (
        <div className="space-y-2">
          <Label>
            {column.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={currentVote === 'up' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(currentVote === 'up' ? null : 'up')}
              className={cn(
                currentVote === 'up' && "bg-green-600 hover:bg-green-700"
              )}
            >
              <ThumbsUp className={cn(
                "h-4 w-4 mr-2",
                currentVote === 'up' && "fill-current"
              )} />
              Up
            </Button>
            <Button
              type="button"
              variant={currentVote === 'down' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange(currentVote === 'down' ? null : 'down')}
              className={cn(
                currentVote === 'down' && "bg-red-600 hover:bg-red-700"
              )}
            >
              <ThumbsDown className={cn(
                "h-4 w-4 mr-2",
                currentVote === 'down' && "fill-current"
              )} />
              Down
            </Button>
          </div>
        </div>
      );
    }

    case 'PROGRESS': {
      const progressValue = typeof value === 'number'
        ? Math.min(100, Math.max(0, value))
        : typeof value === 'string'
        ? Math.min(100, Math.max(0, parseFloat(value) || 0))
        : 0;
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <div className="space-y-2">
            <Input
              id={column.id}
              type="number"
              min="0"
              max="100"
              step="1"
              value={progressValue}
              onChange={(e) => onChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              placeholder="0-100"
              required={isRequired}
            />
            <div className="space-y-1">
              <Progress value={progressValue} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(progressValue)}%
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'LOCATION': {
      let address = '';
      let coordinates: { lat: number; lng: number } | null = null;
      if (value) {
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            address = parsed.address || '';
            if (parsed.lat && parsed.lng) {
              coordinates = { lat: parsed.lat, lng: parsed.lng };
            }
          } catch {
            address = value;
          }
        } else if (typeof value === 'object') {
          const loc = value as { address?: string; lat?: number; lng?: number };
          address = loc.address || '';
          if (loc.lat && loc.lng) {
            coordinates = { lat: loc.lat, lng: loc.lng };
          }
        }
      }
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            value={address}
            onChange={(e) => {
              const locationData: { address?: string; lat?: number; lng?: number } = {};
              if (e.target.value) locationData.address = e.target.value;
              if (coordinates) {
                locationData.lat = coordinates.lat;
                locationData.lng = coordinates.lng;
              }
              onChange(Object.keys(locationData).length > 0 ? locationData : null);
            }}
            placeholder="Enter address or location"
            required={isRequired}
          />
          {coordinates && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </div>
          )}
        </div>
      );
    }

    default:
      return (
        <div className="space-y-2">
          <Label htmlFor={column.id} className="flex items-center gap-1">
            {column.name}
            {isRequired && (
              <>
                <span className="text-destructive font-bold" title="Required field">*</span>
                <span className="text-xs text-muted-foreground font-normal">(required)</span>
              </>
            )}
          </Label>
          <Input
            id={column.id}
            value={getDisplayValue()}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${column.name.toLowerCase()}`}
            required={isRequired}
          />
        </div>
      );
  }
};

