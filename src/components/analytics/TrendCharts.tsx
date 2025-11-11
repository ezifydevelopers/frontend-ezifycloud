import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { TrendingUp, DollarSign, Clock, CreditCard } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface Trends {
  invoiceVolume: TrendDataPoint[];
  amountTrends: TrendDataPoint[];
  approvalTimeTrends: TrendDataPoint[];
  paymentTrends: TrendDataPoint[];
}

interface TrendChartsProps {
  trends: Trends;
  dateFrom: string;
  dateTo: string;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  trends,
  dateFrom,
  dateTo,
}) => {
  const [activeTab, setActiveTab] = useState('volume');

  const renderChart = (data: TrendDataPoint[], title: string, color: string) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const range = maxValue - minValue || 1;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-muted-foreground">
            {format(new Date(dateFrom), 'MMM dd')} - {format(new Date(dateTo), 'MMM dd')}
          </div>
        </div>
        
        {/* Simple bar chart */}
        <div className="h-64 flex items-end justify-between gap-1 overflow-x-auto">
          {data.map((point, index) => {
            const height = ((point.value - minValue) / range) * 100;
            return (
              <div
                key={index}
                className="flex-1 min-w-[4px] flex flex-col items-center group relative"
                title={`${format(new Date(point.date), 'MMM dd')}: ${point.value.toLocaleString()}`}
              >
                <div
                  className={`w-full rounded-t transition-all hover:opacity-80 ${color}`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                {index % Math.ceil(data.length / 10) === 0 && (
                  <div className="text-xs text-muted-foreground mt-1 transform -rotate-45 origin-left whitespace-nowrap">
                    {format(new Date(point.date), 'MMM dd')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">Min</div>
            <div className="text-lg font-semibold">{minValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Max</div>
            <div className="text-lg font-semibold">{maxValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg</div>
            <div className="text-lg font-semibold">
              {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLineChart = (data: TrendDataPoint[], title: string, color: string) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const range = maxValue - minValue || 1;
    const width = 800;
    const height = 200;
    const padding = 40;

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((point.value - minValue) / range) * (height - 2 * padding);
      return { x, y, value: point.value, date: point.date };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-sm text-muted-foreground">
            {format(new Date(dateFrom), 'MMM dd')} - {format(new Date(dateTo), 'MMM dd')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg width={width} height={height} className="w-full">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = height - padding - ratio * (height - 2 * padding);
              const value = minValue + ratio * range;
              return (
                <g key={ratio}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-muted-foreground"
                  >
                    {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </text>
                </g>
              );
            })}

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={color.replace('bg-', '').replace('-600', '')}
              strokeWidth={2}
              className="stroke-blue-600"
            />

            {/* Points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={color.replace('bg-', '').replace('-600', '')}
                  className="fill-blue-600"
                />
                {index % Math.ceil(points.length / 10) === 0 && (
                  <text
                    x={point.x}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {format(new Date(point.date), 'MMM dd')}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">Min</div>
            <div className="text-lg font-semibold">{minValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Max</div>
            <div className="text-lg font-semibold">{maxValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg</div>
            <div className="text-lg font-semibold">
              {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trends Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="volume" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Volume
            </TabsTrigger>
            <TabsTrigger value="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Amount
            </TabsTrigger>
            <TabsTrigger value="approval" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Approval Time
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="mt-4">
            {renderChart(trends.invoiceVolume, 'Invoice Volume Over Time', 'bg-blue-600')}
          </TabsContent>

          <TabsContent value="amount" className="mt-4">
            {renderLineChart(trends.amountTrends, 'Amount Trends', 'bg-green-600')}
          </TabsContent>

          <TabsContent value="approval" className="mt-4">
            {renderLineChart(trends.approvalTimeTrends, 'Approval Time Trends (hours)', 'bg-purple-600')}
          </TabsContent>

          <TabsContent value="payment" className="mt-4">
            {renderLineChart(trends.paymentTrends, 'Payment Rate Trends (%)', 'bg-indigo-600')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

