import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Save,
  Building2,
  Mail,
  Shield,
  Bell,
  Database,
  Users,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Phone,
  MapPin,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    // Company Settings
    companyName: 'Ezify Cloud',
    companyEmail: 'admin@ezifycloud.com',
    companyPhone: '+1 (555) 123-4567',
    companyAddress: '123 Business St, City, State 12345',
    timezone: 'UTC-5',
    companyWebsite: 'https://ezifycloud.com',
    companyLogo: '',
    
    // Leave Settings
    defaultAnnualLeave: 25,
    defaultSickLeave: 10,
    defaultCasualLeave: 8,
    allowCarryForward: true,
    maxCarryForwardDays: 5,
    requireManagerApproval: true,
    allowHalfDayLeave: true,
    maxConsecutiveDays: 14,
    advanceNoticeDays: 2,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notifyOnNewRequest: true,
    notifyOnApproval: true,
    notifyOnRejection: true,
    notifyOnReminder: true,
    notifyOnSystemUpdate: true,
    
    // Security Settings
    sessionTimeout: 30,
    requireTwoFactor: false,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    enableAuditLogs: true,
    dataRetentionDays: 365,
    
    // System Settings
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily',
    logRetentionDays: 365,
    systemVersion: '1.2.3',
    lastUpdate: '2024-12-15',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Settings are already initialized with mock data
    } catch (error) {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Settings saved',
        description: `${section} settings have been updated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
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

  // Mock statistics
  const stats = [
    {
      title: 'System Uptime',
      value: '99.9%',
      description: 'Last 30 days',
      icon: Activity,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      trend: { value: 0.1, isPositive: true },
    },
    {
      title: 'Active Users',
      value: 156,
      description: 'Currently online',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: 'Data Storage',
      value: '2.4 GB',
      description: 'Used of 10 GB',
      icon: Database,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'System Health',
      value: 'Excellent',
      description: 'All systems operational',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
  ];

  const timezones = [
    'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 'UTC-5',
    'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+3',
    'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12'
  ];

  const backupFrequencies = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Configure system-wide settings and manage your organization's preferences.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <stat.icon className={`h-6 w-6 text-white`} />
                </div>
              </div>
              {stat.trend && (
                <div className="flex items-center mt-4">
                  {stat.trend.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend.value}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Settings Tabs */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-6">
          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="leave">Leave Policy</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            {/* Company Settings */}
            <TabsContent value="company">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Company Information</h3>
                  <Button
                    onClick={() => handleSave('Company')}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Company
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Phone Number</Label>
                      <Input
                        id="companyPhone"
                        value={settings.companyPhone}
                        onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyWebsite">Website</Label>
                      <Input
                        id="companyWebsite"
                        value={settings.companyWebsite}
                        onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyAddress">Address</Label>
                      <Textarea
                        id="companyAddress"
                        value={settings.companyAddress}
                        onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="companyLogo">Company Logo URL</Label>
                      <Input
                        id="companyLogo"
                        value={settings.companyLogo}
                        onChange={(e) => handleInputChange('companyLogo', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Leave Policy Settings */}
            <TabsContent value="leave">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Leave Policy Configuration</h3>
                  <Button
                    onClick={() => handleSave('Leave Policy')}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Policy
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Default Leave Days</h4>
                    <div>
                      <Label htmlFor="defaultAnnualLeave">Annual Leave (days)</Label>
                      <Input
                        id="defaultAnnualLeave"
                        type="number"
                        value={settings.defaultAnnualLeave}
                        onChange={(e) => handleInputChange('defaultAnnualLeave', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultSickLeave">Sick Leave (days)</Label>
                      <Input
                        id="defaultSickLeave"
                        type="number"
                        value={settings.defaultSickLeave}
                        onChange={(e) => handleInputChange('defaultSickLeave', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultCasualLeave">Casual Leave (days)</Label>
                      <Input
                        id="defaultCasualLeave"
                        type="number"
                        value={settings.defaultCasualLeave}
                        onChange={(e) => handleInputChange('defaultCasualLeave', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Leave Rules</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div>
                          <h5 className="font-medium text-slate-900">Allow Carry Forward</h5>
                          <p className="text-sm text-slate-500">Employees can carry forward unused leave</p>
                        </div>
                        <Switch
                          checked={settings.allowCarryForward}
                          onCheckedChange={(checked) => handleInputChange('allowCarryForward', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div>
                          <h5 className="font-medium text-slate-900">Require Manager Approval</h5>
                          <p className="text-sm text-slate-500">All leave requests need manager approval</p>
                        </div>
                        <Switch
                          checked={settings.requireManagerApproval}
                          onCheckedChange={(checked) => handleInputChange('requireManagerApproval', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div>
                          <h5 className="font-medium text-slate-900">Allow Half Day Leave</h5>
                          <p className="text-sm text-slate-500">Employees can request half-day leave</p>
                        </div>
                        <Switch
                          checked={settings.allowHalfDayLeave}
                          onCheckedChange={(checked) => handleInputChange('allowHalfDayLeave', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxCarryForwardDays">Max Carry Forward Days</Label>
                    <Input
                      id="maxCarryForwardDays"
                      type="number"
                      value={settings.maxCarryForwardDays}
                      onChange={(e) => handleInputChange('maxCarryForwardDays', parseInt(e.target.value))}
                      className="bg-white/50 border-slate-200/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxConsecutiveDays">Max Consecutive Days</Label>
                    <Input
                      id="maxConsecutiveDays"
                      type="number"
                      value={settings.maxConsecutiveDays}
                      onChange={(e) => handleInputChange('maxConsecutiveDays', parseInt(e.target.value))}
                      className="bg-white/50 border-slate-200/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="advanceNoticeDays">Advance Notice (Days)</Label>
                    <Input
                      id="advanceNoticeDays"
                      type="number"
                      value={settings.advanceNoticeDays}
                      onChange={(e) => handleInputChange('advanceNoticeDays', parseInt(e.target.value))}
                      className="bg-white/50 border-slate-200/50"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Notification Preferences</h3>
                  <Button
                    onClick={() => handleSave('Notifications')}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Notifications
                  </Button>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings).filter(([key, _]) => key.includes('Notification') || key.includes('notify')).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {key === 'emailNotifications' && 'Send notifications via email'}
                          {key === 'smsNotifications' && 'Send notifications via SMS'}
                          {key === 'pushNotifications' && 'Send push notifications to mobile devices'}
                          {key === 'notifyOnNewRequest' && 'Notify when new leave requests are submitted'}
                          {key === 'notifyOnApproval' && 'Notify when leave requests are approved'}
                          {key === 'notifyOnRejection' && 'Notify when leave requests are rejected'}
                          {key === 'notifyOnReminder' && 'Send reminder notifications'}
                          {key === 'notifyOnSystemUpdate' && 'Notify about system updates and maintenance'}
                        </p>
                      </div>
                      <Switch
                        checked={value as boolean}
                        onCheckedChange={(checked) => handleInputChange(key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Security & Privacy</h3>
                  <Button
                    onClick={() => handleSave('Security')}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Security
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Authentication</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div>
                          <h5 className="font-medium text-slate-900">Two-Factor Authentication</h5>
                          <p className="text-sm text-slate-500">Require 2FA for all users</p>
                        </div>
                        <Switch
                          checked={settings.requireTwoFactor}
                          onCheckedChange={(checked) => handleInputChange('requireTwoFactor', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div>
                          <h5 className="font-medium text-slate-900">Enable Audit Logs</h5>
                          <p className="text-sm text-slate-500">Track all system activities</p>
                        </div>
                        <Switch
                          checked={settings.enableAuditLogs}
                          onCheckedChange={(checked) => handleInputChange('enableAuditLogs', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Session & Access</h4>
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                      <Input
                        id="passwordExpiry"
                        type="number"
                        value={settings.passwordExpiry}
                        onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        value={settings.lockoutDuration}
                        onChange={(e) => handleInputChange('lockoutDuration', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="dataRetentionDays">Data Retention Period (days)</Label>
                  <Input
                    id="dataRetentionDays"
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) => handleInputChange('dataRetentionDays', parseInt(e.target.value))}
                    className="bg-white/50 border-slate-200/50"
                  />
                </div>
              </div>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">System Configuration</h3>
                  <Button
                    onClick={() => handleSave('System')}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save System
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">System Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div>
                          <h5 className="font-medium text-slate-900">Maintenance Mode</h5>
                          <p className="text-sm text-slate-500">Put system in maintenance mode</p>
                        </div>
                        <Switch
                          checked={settings.maintenanceMode}
                          onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div>
                          <h5 className="font-medium text-slate-900">Auto Backup</h5>
                          <p className="text-sm text-slate-500">Automatically backup system data</p>
                        </div>
                        <Switch
                          checked={settings.autoBackup}
                          onCheckedChange={(checked) => handleInputChange('autoBackup', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">System Information</h4>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">System Version</span>
                          <Badge variant="outline">{settings.systemVersion}</Badge>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Last Update</span>
                          <span className="text-sm font-medium">{settings.lastUpdate}</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Data Storage</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={24} className="w-16 h-2" />
                            <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select value={settings.backupFrequency} onValueChange={(value) => handleInputChange('backupFrequency', value)}>
                      <SelectTrigger className="bg-white/50 border-slate-200/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {backupFrequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
                    <Input
                      id="logRetentionDays"
                      type="number"
                      value={settings.logRetentionDays}
                      onChange={(e) => handleInputChange('logRetentionDays', parseInt(e.target.value))}
                      className="bg-white/50 border-slate-200/50"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;