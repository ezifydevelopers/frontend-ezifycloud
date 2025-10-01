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
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Target,
  Award,
  Key,
  Lock,
  RefreshCw,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EmployeeSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    address: string;
    bio: string;
    timezone: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    leaveRequestAlerts: boolean;
    approvalNotifications: boolean;
    reminderNotifications: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    showProfileToTeam: boolean;
    showLeaveHistory: boolean;
    showContactInfo: boolean;
    allowDirectMessages: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordChangeRequired: boolean;
    loginNotifications: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    weekStart: 'monday' | 'sunday';
  };
}

const EmployeeSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<EmployeeSettings>({
    profile: {
      name: 'John Doe',
      email: 'john.doe@company.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, State 12345',
      bio: 'Passionate software developer with 5+ years of experience.',
      timezone: 'UTC-5',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      leaveRequestAlerts: true,
      approvalNotifications: true,
      reminderNotifications: true,
      systemUpdates: false,
    },
    privacy: {
      showProfileToTeam: true,
      showLeaveHistory: true,
      showContactInfo: false,
      allowDirectMessages: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordChangeRequired: false,
      loginNotifications: true,
    },
    preferences: {
      theme: 'system',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      weekStart: 'monday',
    },
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

  const handleInputChange = (section: keyof EmployeeSettings, field: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Mock statistics
  const stats = [
    {
      title: 'Account Security',
      value: '85%',
      description: 'Security score',
      icon: Shield,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      trend: { value: 5.2, isPositive: true },
    },
    {
      title: 'Active Sessions',
      value: 2,
      description: 'Current devices',
      icon: Activity,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      title: 'Data Usage',
      value: '1.2 GB',
      description: 'Profile data',
      icon: Target,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'Last Login',
      value: '2h ago',
      description: 'From Chrome',
      icon: Clock,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
  ];

  const timezones = [
    'UTC-12', 'UTC-11', 'UTC-10', 'UTC-9', 'UTC-8', 'UTC-7', 'UTC-6', 'UTC-5',
    'UTC-4', 'UTC-3', 'UTC-2', 'UTC-1', 'UTC+0', 'UTC+1', 'UTC+2', 'UTC+3',
    'UTC+4', 'UTC+5', 'UTC+6', 'UTC+7', 'UTC+8', 'UTC+9', 'UTC+10', 'UTC+11', 'UTC+12'
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
  ];

  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Manage your account settings and preferences.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Profile Active</span>
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
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Profile Information</h3>
                  <Button
                    onClick={() => handleSave('Profile')}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={settings.profile.name}
                        onChange={(e) => handleInputChange('profile', 'name', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={settings.profile.phone}
                        onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={settings.profile.address}
                        onChange={(e) => handleInputChange('profile', 'address', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={settings.profile.bio}
                        onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={settings.profile.timezone} onValueChange={(value) => handleInputChange('profile', 'timezone', value)}>
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
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Notifications
                  </Button>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {key === 'emailNotifications' && 'Receive notifications via email'}
                          {key === 'pushNotifications' && 'Receive push notifications on mobile devices'}
                          {key === 'leaveRequestAlerts' && 'Get alerts for leave request updates'}
                          {key === 'approvalNotifications' && 'Notify when requests are approved or rejected'}
                          {key === 'reminderNotifications' && 'Send reminder notifications for important dates'}
                          {key === 'systemUpdates' && 'Receive notifications about system updates and maintenance'}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => handleInputChange('notifications', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Privacy & Visibility</h3>
                  <Button
                    onClick={() => handleSave('Privacy')}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Privacy
                  </Button>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {key === 'showProfileToTeam' && 'Make your profile visible to team members'}
                          {key === 'showLeaveHistory' && 'Allow team members to view your leave history'}
                          {key === 'showContactInfo' && 'Display contact information in your profile'}
                          {key === 'allowDirectMessages' && 'Allow team members to send you direct messages'}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => handleInputChange('privacy', key, checked)}
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
                  <h3 className="text-lg font-semibold">Security & Authentication</h3>
                  <Button
                    onClick={() => handleSave('Security')}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Security
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                    <div>
                      <h4 className="font-medium text-slate-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => handleInputChange('security', 'twoFactorAuth', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                    <div>
                      <h4 className="font-medium text-slate-900">Login Notifications</h4>
                      <p className="text-sm text-slate-500">Get notified of new login attempts</p>
                    </div>
                    <Switch
                      checked={settings.security.loginNotifications}
                      onCheckedChange={(checked) => handleInputChange('security', 'loginNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                    <div>
                      <h4 className="font-medium text-slate-900">Password Change Required</h4>
                      <p className="text-sm text-slate-500">Force password change on next login</p>
                    </div>
                    <Switch
                      checked={settings.security.passwordChangeRequired}
                      onCheckedChange={(checked) => handleInputChange('security', 'passwordChangeRequired', checked)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="bg-white/50 border-slate-200/50"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Preferences Settings */}
            <TabsContent value="preferences">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">App Preferences</h3>
                  <Button
                    onClick={() => handleSave('Preferences')}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={settings.preferences.theme} onValueChange={(value) => handleInputChange('preferences', 'theme', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={settings.preferences.language} onValueChange={(value) => handleInputChange('preferences', 'language', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={settings.preferences.dateFormat} onValueChange={(value) => handleInputChange('preferences', 'dateFormat', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dateFormats.map((format) => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select value={settings.preferences.timeFormat} onValueChange={(value) => handleInputChange('preferences', 'timeFormat', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="weekStart">Week Starts On</Label>
                      <Select value={settings.preferences.weekStart} onValueChange={(value) => handleInputChange('preferences', 'weekStart', value)}>
                        <SelectTrigger className="bg-white/50 border-slate-200/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="justify-start group hover:bg-blue-50 hover:text-blue-700"
            >
              <Download className="mr-2 h-4 w-4 group-hover:text-blue-600" />
              Export My Data
            </Button>
            <Button
              variant="outline"
              className="justify-start group hover:bg-green-50 hover:text-green-700"
            >
              <Upload className="mr-2 h-4 w-4 group-hover:text-green-600" />
              Import Data
            </Button>
            <Button
              variant="outline"
              className="justify-start group hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4 group-hover:text-red-600" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeSettingsPage;