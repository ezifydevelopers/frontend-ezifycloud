import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardWidgetProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-100',
    icon: 'text-green-600',
    trend: 'text-green-600',
  },
  red: {
    bg: 'bg-red-100',
    icon: 'text-red-600',
    trend: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    trend: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    trend: 'text-orange-600',
  },
};

export const KPICardWidget: React.FC<KPICardWidgetProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  color = 'blue',
  onClick,
}) => {
  const colors = colorClasses[color];

  return (
    <Card
      className={cn(
        'bg-white/90 backdrop-blur-sm border-white/20 shadow-xl transition-all',
        onClick && 'cursor-pointer hover:shadow-2xl hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className={cn('flex items-center gap-1 mt-2 text-xs', colors.trend)}>
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-full', colors.bg)}>
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

