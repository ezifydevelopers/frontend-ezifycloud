import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface ChartWidgetProps {
  title: string;
  type: 'bar' | 'line' | 'pie';
  data: Array<{ name: string; value: number; [key: string]: unknown }>;
  dataKey?: string;
  xAxisKey?: string;
  className?: string;
  height?: number;
  colors?: string[];
}

const defaultColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const getChartIcon = (type: 'bar' | 'line' | 'pie') => {
  switch (type) {
    case 'bar':
      return BarChart3;
    case 'line':
      return LineChartIcon;
    case 'pie':
      return PieChartIcon;
  }
};

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  type,
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  className,
  height = 300,
  colors = defaultColors,
}) => {
  const Icon = getChartIcon(type);

  const chartConfig = React.useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    data.forEach((item, index) => {
      const key = String(item[xAxisKey] || index);
      config[key] = {
        label: String(item[xAxisKey] || `Item ${index + 1}`),
        color: colors[index % colors.length],
      };
    });
    return config;
  }, [data, xAxisKey, colors]);

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
          {type === 'bar' && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} fill={colors[0]} />
            </BarChart>
          )}

          {type === 'line' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}

          {type === 'pie' && (
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={height / 3}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

