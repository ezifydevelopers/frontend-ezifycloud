import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign,
  FileText,
  CreditCard,
  BarChart3,
  PieChart
} from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">View analytics and insights for your invoices</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">$0.00</p>
                  <p className="text-xs text-green-600 mt-1">+0% from last period</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invoices Sent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
                  <p className="text-xs text-blue-600 mt-1">+0% from last period</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">0%</p>
                  <p className="text-xs text-purple-600 mt-1">Average payment time</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">$0.00</p>
                  <p className="text-xs text-yellow-600 mt-1">Unpaid invoices</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No data available</p>
                  <p className="text-sm text-gray-500">Create invoices to see revenue trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>Distribution of payment statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No data available</p>
                  <p className="text-sm text-gray-500">Create invoices to see payment distribution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

