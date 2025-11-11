import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className,
}) => {
  return (
    <Card className={cn('bg-white/90 backdrop-blur-sm border-white/20 shadow-xl', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-sm',
                trend.direction === 'up' ? 'text-green-600' :
                trend.direction === 'down' ? 'text-red-600' :
                'text-gray-500'
              )}>
                <span>
                  {trend.direction === 'up' ? '↗' : 
                   trend.direction === 'down' ? '↘' : '→'}
                </span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

