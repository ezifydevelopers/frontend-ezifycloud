import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { analyticsAPI } from '@/lib/api';
import { 
  FileText, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { TrendCharts } from './TrendCharts';

interface AnalyticsDashboardProps {
  workspaceId?: string;
  boardId?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  workspaceId,
  boardId,
}) => {
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', workspaceId, boardId, dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, string> = {
        dateFrom,
        dateTo,
      };
      if (workspaceId) params.workspaceId = workspaceId;
      if (boardId) params.boardId = boardId;

      const response = await analyticsAPI.getAnalytics(params);
      return response.data;
    },
  });

  const metrics = data?.keyMetrics;
  const trends = data?.trends;

  const metricsCards = [
    {
      title: 'Total Invoices',
      value: metrics?.totalInvoices || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Amount',
      value: `$${metrics?.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Approvals',
      value: metrics?.pendingApprovalsCount || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Overdue Invoices',
      value: metrics?.overdueInvoicesCount || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Avg Approval Time',
      value: `${metrics?.averageApprovalTime.toFixed(1) || '0'} hrs`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Payment Rate',
      value: `${metrics?.paymentRate.toFixed(1) || '0'}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {isLoading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">Error loading analytics</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricsCards.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                    <div className={`p-2 rounded-full ${metric.bgColor}`}>
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trends */}
          {trends && (
            <TrendCharts trends={trends} dateFrom={dateFrom} dateTo={dateTo} />
          )}
        </>
      )}
    </div>
  );
};

