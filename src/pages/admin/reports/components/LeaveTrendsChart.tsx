import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LeaveTrendsChartProps {
  period?: string;
}

const LeaveTrendsChart: React.FC<LeaveTrendsChartProps> = ({ period = 'thisMonth' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [period]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when backend is ready
      // const response = await adminAPI.getLeaveTrends(period);
      // if (response.success && response.data) {
      //   setData(response.data);
      // } else {
      //   setData([]);
      // }
      setData([]);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = data.length > 0 ? Math.max(...data.map(d => Math.max(d.requests, d.approved))) : 1;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Leave Request Trends</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Approved</span>
          </div>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No trend data available</p>
          <p className="text-sm">Data will appear when leave requests are created</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.day || item.week}</span>
                <span className="text-muted-foreground">
                  {item.requests} requests, {item.approved} approved
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(item.requests / maxValue) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(item.approved / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveTrendsChart;
