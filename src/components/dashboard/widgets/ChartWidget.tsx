import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartWidgetProps {
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  data: Array<{ label: string; value: number; [key: string]: unknown }>;
  className?: string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  type,
  data,
  className,
}) => {
  // Simple chart visualization (in production, use recharts or chart.js)
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {type === 'bar' && (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-24 text-sm truncate">{item.label}</div>
                <div className="flex-1 relative h-6 bg-gray-200 rounded">
                  <div
                    className="h-full bg-blue-600 rounded"
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {type === 'line' && (
          <div className="h-64 flex items-end justify-between gap-1">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
                title={`${item.label}: ${item.value}`}
              />
            ))}
          </div>
        )}

        {type === 'pie' && (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getColor(index) }}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.value}</span>
                  {'percentage' in item && (
                    <span className="text-xs text-muted-foreground">
                      {(item.percentage as number).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {type === 'area' && (
          <div className="h-64 flex items-end justify-between gap-1">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex-1 bg-gradient-to-t from-blue-600 to-blue-300 rounded-t transition-all hover:from-blue-700 hover:to-blue-400 relative group"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
                title={`${item.label}: ${item.value}`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {item.label}: {item.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {data.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const getColor = (index: number): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  ];
  return colors[index % colors.length];
};

