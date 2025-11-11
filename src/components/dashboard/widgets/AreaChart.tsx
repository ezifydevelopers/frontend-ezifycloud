import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AreaChartProps {
  title: string;
  data: Array<{ label: string; value: number; [key: string]: unknown }>;
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  data,
  className,
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  // Generate SVG path for area chart
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  });

  const areaPath = `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
  const linePath = `M ${points.join(' L ')}`;

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="w-full h-64 relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Area fill */}
              <path
                d={areaPath}
                fill="url(#areaGradient)"
                opacity="0.3"
              />
              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Data points */}
              {data.map((item, index) => {
                const x = (index / (data.length - 1 || 1)) * 100;
                const y = 100 - ((item.value - minValue) / range) * 100;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="2"
                    fill="#3b82f6"
                    className="hover:r-3 transition-all"
                  />
                );
              })}
            </svg>
            
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              {data.map((item, index) => (
                <span key={index} className="truncate" style={{ maxWidth: `${100 / data.length}%` }}>
                  {item.label}
                </span>
              ))}
            </div>

            {/* Y-axis scale */}
            <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
              <span>{maxValue.toLocaleString()}</span>
              <span>{((maxValue + minValue) / 2).toLocaleString()}</span>
              <span>{minValue.toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

