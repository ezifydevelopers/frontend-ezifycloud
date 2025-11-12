import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save,
  Building2,
  Globe,
  Phone,
  MapPin,
  Clock,
  RefreshCw,
  Activity,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api/adminAPI';
import PageHeader from '@/components/layout/PageHeader';

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const [settings, setSettings] = useState({
    // Company Settings
    companyName: 'Ezify Cloud',
    companyEmail: 'admin@ezifycloud.com',
    companyPhone: '+1 (555) 123-4567',
    companyAddress: '123 Business St, City, State 12345',
    timezone: 'UTC-5',
    companyWebsite: 'https://ezifycloud.com',
    // Probation Settings
    defaultProbationDuration: 90, // days
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 SettingsPage: Fetching settings...');
      
      const [settingsResponse, systemConfigResponse] = await Promise.all([
        adminAPI.getSettings(),
        adminAPI.getSystemConfig().catch(() => ({ success: false, data: null }))
      ]);
      
      console.log('🔍 SettingsPage: Settings response:', settingsResponse);
      console.log('🔍 SettingsPage: System config response:', systemConfigResponse);
      
      if (settingsResponse.success && settingsResponse.data) {
        // Update settings with real data from API
        setSettings(prevSettings => ({
          ...prevSettings,
          // Company Settings
          companyName: settingsResponse.data.company?.name || prevSettings.companyName,
          companyEmail: settingsResponse.data.company?.email || prevSettings.companyEmail,
          companyPhone: settingsResponse.data.company?.phone || prevSettings.companyPhone,
          companyAddress: settingsResponse.data.company?.address || prevSettings.companyAddress,
          timezone: settingsResponse.data.company?.timezone || prevSettings.timezone,
          companyWebsite: settingsResponse.data.company?.website || prevSettings.companyWebsite,
        }));
      }
      
      if (systemConfigResponse.success && systemConfigResponse.data) {
        setSettings(prevSettings => ({
          ...prevSettings,
          defaultProbationDuration: systemConfigResponse.data?.defaultProbationDuration || prevSettings.defaultProbationDuration,
        }));
      }
        
      console.log('✅ SettingsPage: Settings loaded successfully');
    } catch (error) {
      console.error('❌ SettingsPage: Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setLoading(true);
      console.log(`🔍 SettingsPage: Saving ${section} settings...`);
      
      let response;
      
      switch (section.toLowerCase()) {
        case 'company':
          response = await adminAPI.updateCompanyInfo({
            name: settings.companyName,
            email: settings.companyEmail,
            phone: settings.companyPhone,
            address: settings.companyAddress,
            website: settings.companyWebsite,
            timezone: settings.timezone,
          });
          break;
        case 'probation':
          response = await adminAPI.updateSystemConfig({
            defaultProbationDuration: settings.defaultProbationDuration,
          });
          break;
          
        default:
          throw new Error(`Unknown section: ${section}`);
      }
      
      console.log(`🔍 SettingsPage: ${section} settings response:`, response);
      
      if (response.success) {
        toast({
          title: 'Settings saved',
          description: `${section} settings have been updated successfully`,
        });
        console.log(`✅ SettingsPage: ${section} settings saved successfully`);
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error(`❌ SettingsPage: Error saving ${section} settings:`, error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle validation errors specifically
        if (error.message.includes('Validation failed')) {
          errorMessage = 'Please check your input data and try again.';
        }
      }
      
      toast({
        title: 'Error',
        description: `Failed to save ${section} settings: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const stats = [
    {
      title: 'Company Settings',
      value: 'Active',
      description: 'All systems operational',
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Last Updated',
      value: '2 min ago',
      description: 'Settings synchronized',
      icon: RefreshCw,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'System Status',
      value: 'Online',
      description: 'All services running',
      icon: Activity,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Configuration',
      value: 'Complete',
      description: 'All settings configured',
      icon: CheckCircle,
      color: 'from-orange-500 to-yellow-500',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title="Company Settings"
            subtitle="Configure your company information and system preferences."
            icon={Settings}
            iconColor="from-blue-600 to-purple-600"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="bg-white/50 border-white/20 hover:bg-white/80"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </PageHeader>

          {/* Stats Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="group relative h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/30 shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full flex flex-col">
                  <div className="flex items-center justify-between flex-1">
                    <div className="space-y-1 lg:space-y-2 flex-1">
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.description}</p>
                    </div>
                    <div className={`p-2 lg:p-3 bg-gradient-to-r ${stat.color} rounded-xl shadow-lg flex-shrink-0`}>
                      <stat.icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    {stat.trend ? (
                      <span className="text-sm font-medium text-green-600">
                        +{stat.trend.value}%
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-transparent">
                        &nbsp;
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Settings Form */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
              <CardContent className="p-6">
                <Tabs defaultValue={location.state?.tab || 'company'} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 rounded-2xl p-1">
                    <TabsTrigger value="company" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Company Information
                    </TabsTrigger>
                    <TabsTrigger value="probation" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Probation Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* Company Settings */}
                  <TabsContent value="company">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">Company Information</h3>
                            <p className="text-sm text-slate-600">Update your company details and contact information</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSave('Company')}
                          disabled={loading}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company Name</Label>
                            <Input
                              id="companyName"
                              value={settings.companyName}
                              onChange={(e) => handleInputChange('companyName', e.target.value)}
                              className="mt-1 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                              placeholder="Enter company name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyEmail" className="text-sm font-medium text-slate-700">Company Email</Label>
                            <Input
                              id="companyEmail"
                              type="email"
                              value={settings.companyEmail}
                              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                              className="mt-1 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                              placeholder="Enter company email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyPhone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                            <Input
                              id="companyPhone"
                              value={settings.companyPhone}
                              onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                              className="mt-1 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="companyWebsite" className="text-sm font-medium text-slate-700">Website</Label>
                            <Input
                              id="companyWebsite"
                              value={settings.companyWebsite}
                              onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                              className="mt-1 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                              placeholder="Enter website URL"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="companyAddress" className="text-sm font-medium text-slate-700">Address</Label>
                            <Input
                              id="companyAddress"
                              value={settings.companyAddress}
                              onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                              className="mt-1 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                              placeholder="Enter company address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="timezone" className="text-sm font-medium text-slate-700">Timezone</Label>
                            <Input
                              id="timezone"
                              value={settings.timezone}
                              onChange={(e) => handleInputChange('timezone', e.target.value)}
                              className="mt-1 bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                              placeholder="Enter timezone"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Probation Settings */}
                  <TabsContent value="probation">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                            <UserCheck className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">Probation Period Settings</h3>
                            <p className="text-sm text-slate-600">Configure default probation period duration for new employees</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSave('Probation')}
                          disabled={loading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="defaultProbationDuration" className="text-sm font-medium text-slate-700">
                              Default Probation Duration (Days)
                            </Label>
                            <Input
                              id="defaultProbationDuration"
                              type="number"
                              min="30"
                              max="365"
                              value={settings.defaultProbationDuration}
                              onChange={(e) => handleInputChange('defaultProbationDuration', parseInt(e.target.value, 10) || 90)}
                              className="mt-1 bg-white/50 border-slate-200/50 focus:border-purple-500 focus:ring-purple-500/20"
                              placeholder="Enter default probation duration in days"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                              This duration will be applied to all new employees when they join. 
                              Range: 30-365 days (default: 90 days)
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">About Probation Period</h4>
                            <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
                              <li>Probation period is automatically set when an employee joins</li>
                              <li>Leaves taken during probation are marked as unpaid</li>
                              <li>Admins can edit individual employee probation dates from the Employees page</li>
                              <li>Probation completion alerts appear on the admin dashboard</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;