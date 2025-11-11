import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GaugeChartProps {
  title: string;
  value: number;
  max: number;
  className?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  value,
  max,
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180; // Semi-circle gauge
  const color = percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative w-48 h-24">
          {/* Background arc */}
          <svg width="200" height="120" className="absolute inset-0">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="20"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Value arc */}
          <svg width="200" height="120" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
            <path
              d={`M 20 100 A 80 80 0 ${angle > 90 ? 1 : 0} 1 ${20 + (180 * (angle / 180))} ${100 - (80 * Math.sin((angle * Math.PI) / 180))}`}
              fill="none"
              stroke={color}
              strokeWidth="20"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color }}>
                {value.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">of {max.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Needle indicator (optional) */}
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground">
            {percentage >= 75 ? '✓ Excellent' : percentage >= 50 ? '→ Good' : '⚠ Needs Attention'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

