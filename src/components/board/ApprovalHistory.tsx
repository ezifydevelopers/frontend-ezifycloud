// Approval History Component - Complete timeline with time tracking and export

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  MessageSquare,
  Download,
  Calendar,
  Timer,
  RefreshCw,
} from 'lucide-react';
import { approvalHistoryAPI, ApprovalHistory, ApprovalHistoryEntry } from '@/lib/api/approvalHistoryAPI';
import { format, formatDistanceToNow, differenceInHours, differenceInDays, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ApprovalHistoryProps {
  itemId: string;
  itemName?: string;
  className?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1: 'Level 1',
  LEVEL_2: 'Level 2',
  LEVEL_3: 'Level 3',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
};

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  LEVEL_1: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  LEVEL_2: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  LEVEL_3: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
};

export const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({
  itemId,
  itemName,
  className,
}) => {
  const { toast } = useToast();
  const [history, setHistory] = useState<ApprovalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await approvalHistoryAPI.getApprovalHistory(itemId);
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        throw new Error(response.message || 'Failed to load approval history');
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load approval history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      fetchHistory();
    }
  }, [itemId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await approvalHistoryAPI.exportApprovalHistory(itemId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `approval-history-${itemId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Approval history exported successfully',
      });
    } catch (error) {
      console.error('Error exporting approval history:', error);
      toast({
        title: 'Error',
        description: 'Failed to export approval history',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const formatTimeTaken = (hours?: number): string => {
    if (!hours) return 'N/A';
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      if (m > 0) {
        return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
      }
      return `${h} hour${h !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      if (remainingHours > 0) {
        return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      }
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  const renderHistoryEntry = (entry: ApprovalHistoryEntry, index: number) => {
    const statusConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;
    const levelColors = LEVEL_COLORS[entry.level] || LEVEL_COLORS.LEVEL_1;
    const isLast = index === (history?.entries.length || 0) - 1;

    return (
      <div key={entry.id} className="relative">
        {/* Timeline line */}
        {!isLast && (
          <div
            className={cn(
              'absolute left-6 top-16 w-0.5 h-full z-0',
              entry.status === 'approved' ? 'bg-green-300' : 
              entry.status === 'rejected' ? 'bg-red-300' : 
              'bg-yellow-300'
            )}
          />
        )}

        <div className="relative z-10 flex items-start gap-4 pb-6">
          {/* Icon circle */}
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full border-2 bg-white flex-shrink-0',
              entry.status === 'approved' && 'border-green-500 bg-green-50',
              entry.status === 'rejected' && 'border-red-500 bg-red-50',
              entry.status === 'pending' && 'border-yellow-500 bg-yellow-50'
            )}
          >
            <StatusIcon className={cn(
              'h-5 w-5',
              entry.status === 'approved' && 'text-green-600',
              entry.status === 'rejected' && 'text-red-600',
              entry.status === 'pending' && 'text-yellow-600'
            )} />
          </div>

          {/* Content */}
          <div className={cn(
            'flex-1',
            levelColors.bg,
            'rounded-lg p-4 border',
            levelColors.border
          )}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className={cn('font-semibold text-sm', levelColors.text)}>
                    {LEVEL_LABELS[entry.level] || entry.level}
                  </h4>
                  <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Approver */}
                {entry.approver && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <User className="h-3 w-3" />
                    <span>{entry.approver.name}</span>
                    {entry.approver.email && (
                      <span className="text-muted-foreground/70">({entry.approver.email})</span>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Created: {format(new Date(entry.createdAt), 'PPP p')}
                    </span>
                  </div>
                  {entry.approvedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {entry.status === 'approved' ? 'Approved' : 'Updated'}: {format(new Date(entry.approvedAt), 'PPP p')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Time taken */}
              {entry.timeTaken !== undefined && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/80 rounded border text-xs">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{formatTimeTaken(entry.timeTaken)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Comments */}
            {entry.comments && (
              <div className="mt-3 pt-3 border-t border-white/50">
                <div className="flex items-start gap-2 text-xs">
                  <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium text-muted-foreground mb-1">Comments:</div>
                    <div className="italic text-foreground/80">{entry.comments}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.entries.length === 0) {
    return (
      <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Approval History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No approval history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Approval History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {history.entries.map((entry, index) => renderHistoryEntry(entry, index))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Total Approvals:</span>
            <span className="font-semibold">{history.entries.length}</span>
          </div>
          {history.totalTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Total Time:</span>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatTimeTaken(history.totalTime)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

