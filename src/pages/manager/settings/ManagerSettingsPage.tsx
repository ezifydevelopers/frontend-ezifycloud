import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Bell,
  Shield,
  Calendar,
  Users,
  Settings,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Target,
  Award,
} from 'lucide-react';

interface ManagerSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    leaveRequestAlerts: boolean;
    teamUpdates: boolean;
    weeklyReports: boolean;
    urgentAlerts: boolean;
  };
  approvalSettings: {
    autoApproveSickLeave: boolean;
    requireReasonForRejection: boolean;
    maxConsecutiveDays: number;
    advanceNoticeDays: number;
    workingHoursStart: string;
    workingHoursEnd: string;
  };
  teamSettings: {
    allowSelfApproval: boolean;
    requireManagerApproval: boolean;
    allowOverlappingLeaves: boolean;
    maxTeamMembersOnLeave: number;
    departmentHolidays: string[];
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordChangeRequired: boolean;
    loginNotifications: boolean;
  };
}

const ManagerSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ManagerSettings>({
    profile: {
      name: 'John Manager',
      email: 'john.manager@company.com',
      phone: '+1-555-0123',
      department: 'Engineering',
      position: 'Engineering Manager',
      bio: 'Experienced engineering manager with 8+ years in team leadership and project management.',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      leaveRequestAlerts: true,
      teamUpdates: true,
      weeklyReports: false,
      urgentAlerts: true,
    },
    approvalSettings: {
      autoApproveSickLeave: false,
      requireReasonForRejection: true,
      maxConsecutiveDays: 14,
      advanceNoticeDays: 2,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00',
    },
    teamSettings: {
      allowSelfApproval: false,
      requireManagerApproval: true,
      allowOverlappingLeaves: true,
      maxTeamMembersOnLeave: 3,
      departmentHolidays: ['Christmas', 'New Year', 'Thanksgiving'],
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordChangeRequired: false,
      loginNotifications: true,
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

  const handleInputChange = (section: keyof ManagerSettings, field: string, value: unknown) => {
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
      title: 'Team Members',
      value: 12,
      description: 'Under management',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: { value: 8.3, isPositive: true },
    },
    {
      title: 'Approvals Today',
      value: 5,
      description: 'Leave requests processed',
      icon: Activity,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: 'Team Efficiency',
      value: '94%',
      description: 'Average performance',
      icon: Target,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
      trend: { value: 5.2, isPositive: true },
    },
    {
      title: 'Active Projects',
      value: 8,
      description: 'Currently managed',
      icon: Activity,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Manager Settings
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Configure your management preferences and team settings.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Settings Active</span>
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
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Profile Information</h3>
                  <Button
                    onClick={() => handleSave('Profile')}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
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
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={settings.profile.department}
                        onChange={(e) => handleInputChange('profile', 'department', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={settings.profile.position}
                        onChange={(e) => handleInputChange('profile', 'position', e.target.value)}
                        className="bg-white/50 border-slate-200/50"
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
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
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
                          {key === 'pushNotifications' && 'Receive push notifications'}
                          {key === 'leaveRequestAlerts' && 'Get alerts for new leave requests'}
                          {key === 'teamUpdates' && 'Receive team member updates'}
                          {key === 'weeklyReports' && 'Get weekly team reports'}
                          {key === 'urgentAlerts' && 'Receive urgent notifications immediately'}
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

            {/* Approval Settings */}
            <TabsContent value="approvals">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Approval Settings</h3>
                  <Button
                    onClick={() => handleSave('Approvals')}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Approvals
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                      <div>
                        <h4 className="font-medium text-slate-900">Auto-approve Sick Leave</h4>
                        <p className="text-sm text-slate-500">Automatically approve sick leave requests</p>
                      </div>
                      <Switch
                        checked={settings.approvalSettings.autoApproveSickLeave}
                        onCheckedChange={(checked) => handleInputChange('approvalSettings', 'autoApproveSickLeave', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                      <div>
                        <h4 className="font-medium text-slate-900">Require Reason for Rejection</h4>
                        <p className="text-sm text-slate-500">Mandatory reason when rejecting requests</p>
                      </div>
                      <Switch
                        checked={settings.approvalSettings.requireReasonForRejection}
                        onCheckedChange={(checked) => handleInputChange('approvalSettings', 'requireReasonForRejection', checked)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maxConsecutiveDays">Max Consecutive Days</Label>
                      <Input
                        id="maxConsecutiveDays"
                        type="number"
                        value={settings.approvalSettings.maxConsecutiveDays}
                        onChange={(e) => handleInputChange('approvalSettings', 'maxConsecutiveDays', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="advanceNoticeDays">Advance Notice (Days)</Label>
                      <Input
                        id="advanceNoticeDays"
                        type="number"
                        value={settings.approvalSettings.advanceNoticeDays}
                        onChange={(e) => handleInputChange('approvalSettings', 'advanceNoticeDays', parseInt(e.target.value))}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="workingHoursStart">Work Start Time</Label>
                        <Input
                          id="workingHoursStart"
                          type="time"
                          value={settings.approvalSettings.workingHoursStart}
                          onChange={(e) => handleInputChange('approvalSettings', 'workingHoursStart', e.target.value)}
                          className="bg-white/50 border-slate-200/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="workingHoursEnd">Work End Time</Label>
                        <Input
                          id="workingHoursEnd"
                          type="time"
                          value={settings.approvalSettings.workingHoursEnd}
                          onChange={(e) => handleInputChange('approvalSettings', 'workingHoursEnd', e.target.value)}
                          className="bg-white/50 border-slate-200/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Team Settings */}
            <TabsContent value="team">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Team Management</h3>
                  <Button
                    onClick={() => handleSave('Team')}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Team
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                    <div>
                      <h4 className="font-medium text-slate-900">Allow Self-Approval</h4>
                      <p className="text-sm text-slate-500">Let team members approve their own requests</p>
                    </div>
                    <Switch
                      checked={settings.teamSettings.allowSelfApproval}
                      onCheckedChange={(checked) => handleInputChange('teamSettings', 'allowSelfApproval', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                    <div>
                      <h4 className="font-medium text-slate-900">Require Manager Approval</h4>
                      <p className="text-sm text-slate-500">All requests need manager approval</p>
                    </div>
                    <Switch
                      checked={settings.teamSettings.requireManagerApproval}
                      onCheckedChange={(checked) => handleInputChange('teamSettings', 'requireManagerApproval', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50">
                    <div>
                      <h4 className="font-medium text-slate-900">Allow Overlapping Leaves</h4>
                      <p className="text-sm text-slate-500">Multiple team members can be on leave simultaneously</p>
                    </div>
                    <Switch
                      checked={settings.teamSettings.allowOverlappingLeaves}
                      onCheckedChange={(checked) => handleInputChange('teamSettings', 'allowOverlappingLeaves', checked)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTeamMembersOnLeave">Max Team Members on Leave</Label>
                    <Input
                      id="maxTeamMembersOnLeave"
                      type="number"
                      value={settings.teamSettings.maxTeamMembersOnLeave}
                      onChange={(e) => handleInputChange('teamSettings', 'maxTeamMembersOnLeave', parseInt(e.target.value))}
                      className="bg-white/50 border-slate-200/50"
                    />
                  </div>
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
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
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
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerSettingsPage;