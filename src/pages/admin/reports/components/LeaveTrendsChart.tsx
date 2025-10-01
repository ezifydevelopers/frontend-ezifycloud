import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LeaveTrendsChartProps {
  period: string;
}

const LeaveTrendsChart: React.FC<LeaveTrendsChartProps> = ({ period }) => {
  // Mock data - replace with actual chart implementation
  const mockData = {
    thisWeek: [
      { day: 'Mon', requests: 12, approved: 10 },
      { day: 'Tue', requests: 8, approved: 7 },
      { day: 'Wed', requests: 15, approved: 12 },
      { day: 'Thu', requests: 6, approved: 5 },
      { day: 'Fri', requests: 9, approved: 8 },
    ],
    thisMonth: [
      { week: 'Week 1', requests: 45, approved: 38 },
      { week: 'Week 2', requests: 52, approved: 44 },
      { week: 'Week 3', requests: 38, approved: 32 },
      { week: 'Week 4', requests: 41, approved: 35 },
    ],
  };

  const data = period === 'thisWeek' ? mockData.thisWeek : mockData.thisMonth;
  const maxValue = Math.max(...data.map(d => Math.max(d.requests, d.approved)));

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
    </div>
  );
};

export default LeaveTrendsChart;
