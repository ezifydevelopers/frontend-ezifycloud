import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StatusDistributionData {
  status: string;
  count: number;
  percentage: number;
  color?: string;
}

interface StatusDistributionWidgetProps {
  title: string;
  data: StatusDistributionData[];
  className?: string;
}

export const StatusDistributionWidget: React.FC<StatusDistributionWidgetProps> = ({
  title,
  data,
  className,
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || '#6b7280' }}
                  />
                  <span className="text-sm font-medium capitalize">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress
                value={item.percentage}
                className="h-2"
                style={{
                  ['--progress-background' as string]: item.color || '#6b7280',
                }}
              />
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No status data available
            </div>
          )}
          {total > 0 && (
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total</span>
                <span className="font-semibold">{total}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

