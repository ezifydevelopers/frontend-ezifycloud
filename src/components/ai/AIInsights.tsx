import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  BarChart3,
} from 'lucide-react';
import { aiAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AIInsightsProps {
  boardId?: string;
  workspaceId?: string;
  type?: 'board_summary' | 'team_insights' | 'trends';
  trigger?: React.ReactNode;
  inline?: boolean;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  boardId,
  workspaceId,
  type = 'board_summary',
  trigger,
  inline = false,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    metrics?: Array<{ label: string; value: string | number }>;
    trends?: Array<{ label: string; description: string; direction: 'up' | 'down' | 'stable' }>;
    insights?: string[];
  } | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [open, setOpen] = useState(false);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.generateInsights({
        type,
        boardId,
        workspaceId,
        timeframe,
      });

      if (response.success && response.data) {
        setInsights(response.data);
      } else {
        throw new Error(response.message || 'Failed to generate insights');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate insights',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inline && boardId) {
      fetchInsights();
    }
  }, [boardId, timeframe, inline]);

  const typeLabels = {
    board_summary: 'Board Summary',
    team_insights: 'Team Insights',
    trends: 'Trends',
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  if (inline) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              {typeLabels[type]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={(value: typeof timeframe) => setTimeframe(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchInsights} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-600 mb-4" />
              <p className="text-sm text-muted-foreground">Generating insights...</p>
            </div>
          ) : insights ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">{insights.summary}</p>

              {insights.metrics && insights.metrics.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {insights.metrics.map((metric, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-lg font-semibold">{metric.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {insights.trends && insights.trends.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Trends:</p>
                  {insights.trends.map((trend, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                      {getTrendIcon(trend.direction)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{trend.label}</p>
                        <p className="text-xs text-muted-foreground">{trend.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {insights.insights && insights.insights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Insights:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {insights.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click generate to create insights</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            {typeLabels[type]}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            {typeLabels[type]}
          </DialogTitle>
          <DialogDescription>
            AI-powered insights and analysis for your board and team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={(value: typeof timeframe) => setTimeframe(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchInsights} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-600 mb-4" />
              <p className="text-sm text-muted-foreground">AI is analyzing your data...</p>
            </div>
          )}

          {insights && !loading && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">{insights.summary}</p>

              {insights.metrics && (
                <div className="grid grid-cols-3 gap-3">
                  {insights.metrics.map((metric, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-xl font-semibold">{metric.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {insights.trends && insights.trends.length > 0 && (
                <div className="space-y-2">
                  {insights.trends.map((trend, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      {getTrendIcon(trend.direction)}
                      <div>
                        <p className="font-medium text-sm">{trend.label}</p>
                        <p className="text-xs text-muted-foreground">{trend.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {insights.insights && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Key Insights:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {insights.insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

