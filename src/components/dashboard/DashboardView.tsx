import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw, Plus } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dashboard, WidgetConfig } from '@/types/dashboard';
import { DashboardLayout } from './DashboardLayout';

interface DashboardViewProps {
  dashboardId: string;
  onEdit?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashboardId,
  onEdit,
}) => {
  const { toast } = useToast();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetDataMap, setWidgetDataMap] = useState<Map<number, unknown>>(new Map());
  const [loadingWidgets, setLoadingWidgets] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchDashboard();
  }, [dashboardId]);

  useEffect(() => {
    if (dashboard && dashboard.widgets) {
      loadWidgetData();
    }
  }, [dashboard]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboardById(dashboardId);
      if (response.success && response.data) {
        setDashboard(response.data as Dashboard);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWidgetData = async () => {
    if (!dashboard?.widgets) return;

    const newMap = new Map<number, unknown>();
    const loadingSet = new Set<number>();

    for (let i = 0; i < dashboard.widgets.length; i++) {
      loadingSet.add(i);
      try {
        const response = await dashboardAPI.calculateWidgetData(dashboard.widgets[i]);
        if (response.success && response.data) {
          newMap.set(i, response.data);
        }
      } catch (error) {
        console.error(`Error loading widget ${i}:`, error);
      } finally {
        loadingSet.delete(i);
      }
    }

    setWidgetDataMap(newMap);
    setLoadingWidgets(loadingSet);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>Dashboard not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{dashboard.name}</CardTitle>
            {dashboard.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {dashboard.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadWidgetData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dashboard.widgets && dashboard.widgets.length > 0 ? (
          <DashboardLayout
            widgets={dashboard.widgets}
            widgetData={widgetDataMap}
            editable={false}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No widgets configured. Add widgets to see data.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

