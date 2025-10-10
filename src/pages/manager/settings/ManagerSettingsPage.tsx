import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { managerAPI } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import {
  User,
  Settings,
  Save,
  Mail,
  Phone,
  MapPin,
  Clock,
  Building2,
  RefreshCw,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ManagerSettings {
  profile: ProfileData;
}

const ManagerSettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<ManagerSettings>({
    profile: {
      id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug effect to log current settings
  useEffect(() => {
    console.log('🔍 Current settings state:', settings);
    console.log('🔍 Profile data:', settings.profile);
  }, [settings]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching manager settings...');
      
      const response = await managerAPI.getProfile();
      console.log('🔍 Manager profile response:', response);
      
      if (response.success && response.data) {
        const profileData = response.data as ProfileData;
        setSettings(prev => ({
          ...prev,
          profile: profileData
        }));
        setOriginalProfile(profileData);
        console.log('✅ Manager profile loaded successfully');
      } else {
        console.warn('⚠️ No profile data received, using fallback');
        // Fallback to mock data if API fails
        const mockProfile: ProfileData = {
          id: '1',
          name: 'John Manager',
          email: 'john.manager@ezify.com',
          phone: '+1 (555) 123-4567',
          department: 'Engineering',
          bio: 'Experienced engineering manager with 8+ years in team leadership.',
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date(),
        };
        setSettings(prev => ({
          ...prev,
          profile: mockProfile
        }));
        setOriginalProfile(mockProfile);
      }
    } catch (error: unknown) {
      console.error('❌ Error fetching manager settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to load settings: ${errorMessage}`,
        variant: "destructive",
      });
      
      // Fallback to mock data
      const mockProfile: ProfileData = {
        id: '1',
        name: 'John Manager',
        email: 'john.manager@ezify.com',
        phone: '+1 (555) 123-4567',
        department: 'Engineering',
        bio: 'Experienced engineering manager with 8+ years in team leadership.',
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date(),
      };
      setSettings(prev => ({
        ...prev,
        profile: mockProfile
      }));
      setOriginalProfile(mockProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));

    // Check if there are unsaved changes
    if (originalProfile) {
      const hasChanges = Object.keys(originalProfile).some(key => {
        const typedKey = key as keyof ProfileData;
        return originalProfile[typedKey] !== settings.profile[typedKey];
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setSaving(true);
      console.log('💾 Saving manager profile...', settings.profile);
      
      // Filter only the fields that the backend expects
      const profileData = {
        name: settings.profile.name,
        phone: settings.profile.phone || '',
        department: settings.profile.department || '',
        bio: settings.profile.bio || '',
      };
      
      console.log('💾 Sending profile data:', profileData);
      
      const response = await managerAPI.updateProfile(profileData);
      console.log('💾 Update response:', response);
      
      if (response.success) {
        setOriginalProfile(settings.profile);
        setHasUnsavedChanges(false);
        toast({
          title: "Success",
          description: `${section} updated successfully!`,
        });
        console.log('✅ Manager profile saved successfully');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: unknown) {
      console.error('❌ Error saving manager profile:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle validation errors specifically
        if (error.message.includes('Validation failed')) {
          errorMessage = 'Please check your input data and try again.';
        }
      }
      
      toast({
        title: "Error",
        description: `Failed to save ${section.toLowerCase()}: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    {
      title: 'Team Members',
      value: '12',
      description: 'Active team members',
      icon: User,
      color: 'bg-blue-500',
    },
    {
      title: 'Pending Approvals',
      value: '5',
      description: 'Awaiting review',
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      title: 'Department',
      value: settings.profile.department || 'Engineering',
      description: 'Your department',
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      title: 'Account Status',
      value: 'Active',
      description: 'Account is active',
      icon: CheckCircle,
      color: 'bg-purple-500',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader
          title="Manager Settings"
          subtitle="Manage your profile and preferences."
          icon={Settings}
          iconColor="from-green-600 to-blue-600"
        />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color} shadow-lg`}>
                    <stat.icon className={`h-4 w-4 text-white`} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Settings Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1 bg-slate-100/50 rounded-2xl p-1">
                <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Profile Information
                </TabsTrigger>
              </TabsList>

              {/* Profile Settings */}
              <TabsContent value="profile">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Profile Information</h3>
                        <p className="text-sm text-slate-600">Manage your personal information and profile details</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSave('Profile')}
                      disabled={saving || !hasUnsavedChanges}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Avatar Section */}
                    <div className="lg:col-span-1">
                      <div className="text-center space-y-4">
                        <div className="relative inline-block">
                          <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-lg">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl font-bold">
                              {settings.profile.name ? settings.profile.name.charAt(0).toUpperCase() : 'M'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-slate-800">{settings.profile.name || 'Manager Name'}</h4>
                          <p className="text-sm text-slate-600">{settings.profile.department || 'Department'}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active Manager
                        </Badge>
                      </div>
                    </div>

                    {/* Profile Form */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                          <Input
                            id="name"
                            value={settings.profile.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={settings.profile.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="Enter your email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                          <Input
                            id="phone"
                            value={settings.profile.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="Enter your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department" className="text-sm font-medium text-slate-700">Department</Label>
                          <Input
                            id="department"
                            value={settings.profile.department || ''}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            className="bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="Enter your department"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-medium text-slate-700">Bio</Label>
                        <Textarea
                          id="bio"
                          value={settings.profile.bio || ''}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          className="bg-white/50 border-slate-200/50 focus:border-blue-500 focus:ring-blue-500/20 min-h-[100px]"
                          placeholder="Tell us about yourself..."
                        />
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
  );
};

export default ManagerSettingsPage;
