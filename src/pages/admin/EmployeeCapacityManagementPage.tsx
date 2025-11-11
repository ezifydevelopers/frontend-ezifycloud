import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/layout/PageHeader';
import { withDashboardData, WithDashboardDataProps } from '@/components/hoc/withDashboardData';
import { withCapacityData, WithCapacityDataProps } from '@/components/hoc/withCapacityData';
import EmployeesTable from '@/components/employee/EmployeesTable';
import CapacityOverview from '@/components/capacity/CapacityOverview';
import {
  Users,
  Building2,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface EmployeeCapacityManagementPageProps extends WithDashboardDataProps, WithCapacityDataProps {}

const EmployeeCapacityManagementPage: React.FC<EmployeeCapacityManagementPageProps> = ({ 
  dashboardData: centralizedData, 
  refreshDashboardData, 
  isRefreshing,
  capacityData,
  refreshCapacityData,
  isRefreshingCapacity
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employees');

  const handleRefresh = async () => {
    await Promise.all([
      refreshDashboardData(),
      refreshCapacityData()
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title="Employee & Capacity Management"
            subtitle="Manage employees and track office capacity in one unified interface"
            icon={Users}
            iconColor="from-blue-600 to-purple-600"
          >
            <button 
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              onClick={handleRefresh}
              disabled={isRefreshing || isRefreshingCapacity}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isRefreshingCapacity) ? 'animate-spin' : ''}`} />
              {(isRefreshing || isRefreshingCapacity) ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </PageHeader>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-1 shadow-lg">
              <TabsTrigger 
                value="employees" 
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Employee Management
              </TabsTrigger>
              <TabsTrigger 
                value="capacity" 
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Office Capacity
              </TabsTrigger>
            </TabsList>

            {/* Employee Management Tab */}
            <TabsContent value="employees" className="space-y-6">
              <EmployeesTable 
                showStats={true}
                showFilters={true}
                showCreateButton={true}
                showExport={true}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            {/* Office Capacity Tab */}
            <TabsContent value="capacity" className="space-y-6">
              <CapacityOverview 
                capacityData={capacityData}
                showStats={true}
                showFilters={true}
                showRefresh={true}
                onRefresh={refreshCapacityData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Create a combined HOC that provides both dashboard and capacity data
const withCombinedData = <P extends object>(
  Component: React.ComponentType<P & WithDashboardDataProps & WithCapacityDataProps>
): React.ComponentType<P> => {
  const WithDashboardData = withDashboardData(Component);
  const WithCapacityData = withCapacityData(WithDashboardData);
  return WithCapacityData;
};

// Explicitly type the wrapped component to take no props (all props are provided by HOCs)
const EmployeeCapacityManagementPageWithAllData: React.FC<{}> = withCombinedData(EmployeeCapacityManagementPage);

export default EmployeeCapacityManagementPageWithAllData;
