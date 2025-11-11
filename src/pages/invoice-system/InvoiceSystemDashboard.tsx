import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  CreditCard,
  BarChart3,
  Plus,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const InvoiceSystemDashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Total Invoices',
      value: '0',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Revenue',
      value: '$0.00',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Pending Payments',
      value: '0',
      icon: CreditCard,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Overdue',
      value: '0',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice System</h1>
            <p className="text-gray-600 mt-1">Manage invoices, payments, and financial records</p>
          </div>
          <Button 
            onClick={() => navigate('/invoice-system/invoices/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/invoice-system/invoices')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                All Invoices
              </CardTitle>
              <CardDescription>View and manage all invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/invoice-system/payments')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Payments
              </CardTitle>
              <CardDescription>Track payments and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                View Payments
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/invoice-system/reports')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Reports
              </CardTitle>
              <CardDescription>Generate and view reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                View Reports
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
              <p className="text-sm text-gray-500 mt-2">Create your first invoice to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceSystemDashboard;

