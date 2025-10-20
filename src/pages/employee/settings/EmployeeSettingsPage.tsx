import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { 
  Settings, 
  Save,
  User,
  Mail,
  Phone,
  Building2,
  RefreshCw,
  Shield,
  Bell,
  Edit3,
  Award,
} from 'lucide-react';

interface EmployeeSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    bio: string;
    avatar?: string;
    joinDate: string;
    employeeId: string;
  };
}

interface OriginalProfile {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  bio: string;
  avatar?: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  department?: string;
  profilePicture?: string;
  createdAt: Date;
  phone?: string;
  bio?: string;
}

const EmployeeSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<OriginalProfile | null>(null);
  const [settings, setSettings] = useState<EmployeeSettings>({
    profile: {
      name: user?.name || 'John Employee',
      email: user?.email || 'employee@company.com',
      phone: '+1 (555) 123-4567',
      department: user?.department || 'Unassigned',
      position: 'Software Developer',
      bio: 'Passionate developer with expertise in modern web technologies.',
      avatar: '',
      joinDate: '2023-01-15',
      employeeId: 'EMP-2023-001',
    },
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Settings: Fetching profile data...');
      
      const response = await employeeAPI.getProfile();
      console.log('🔍 Settings: API response:', response);
      
      if (response.success && response.data) {
        const profileData = response.data as ProfileData;
        const updatedSettings = {
          profile: {
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            department: profileData.department || 'Unassigned',
            position: 'Employee', // Default position
            bio: profileData.bio || '',
            avatar: profileData.profilePicture || '',
            joinDate: profileData.createdAt ? new Date(profileData.createdAt).toISOString().split('T')[0] : '2023-01-15',
            employeeId: profileData.id || 'EMP-001',
          },
        };
        
        setSettings(updatedSettings);
        
        // Store original profile for change tracking
        setOriginalProfile({
          name: updatedSettings.profile.name,
          email: updatedSettings.profile.email,
          phone: updatedSettings.profile.phone,
          department: updatedSettings.profile.department,
          position: updatedSettings.profile.position,
          bio: updatedSettings.profile.bio,
          avatar: updatedSettings.profile.avatar,
        });
        
        setHasUnsavedChanges(false);
        console.log('🔍 Settings: Profile loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('🔍 Settings: Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Settings: Current settings:', settings);
    console.log('🔍 Settings: Original profile:', originalProfile);
    console.log('🔍 Settings: Has unsaved changes:', hasUnsavedChanges);
  }, [settings, originalProfile, hasUnsavedChanges]);

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('🔍 Settings: Saving profile data...', settings.profile);
      
      const updateData = {
        name: settings.profile.name,
        phone: settings.profile.phone,
        bio: settings.profile.bio,
        address: '', // Add address if needed
        emergencyContact: '', // Add emergency contact if needed
        emergencyPhone: '', // Add emergency phone if needed
      };
      
      console.log('🔍 Settings: Update data being sent:', updateData);
      
      const response = await employeeAPI.updateProfile(updateData);
      
      console.log('🔍 Settings: Update response:', response);
      
      if (response.success) {
        // Update original profile to reflect saved state
        setOriginalProfile({
          name: settings.profile.name,
          email: settings.profile.email,
          phone: settings.profile.phone,
          department: settings.profile.department,
          position: settings.profile.position,
          bio: settings.profile.bio,
          avatar: settings.profile.avatar,
        });
        
        setHasUnsavedChanges(false);
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully',
        });
        
        console.log('🔍 Settings: Profile saved successfully');
      } else {
        console.error('🔍 Settings: API returned error:', response);
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('🔍 Settings: Error saving profile:', error);
      
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
        description: `Failed to save profile settings: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
    
    // Check for changes after state update
    setTimeout(() => {
      if (originalProfile) {
        const currentProfile = {
          name: settings.profile.name,
          email: settings.profile.email,
          phone: settings.profile.phone,
          department: settings.profile.department,
          position: settings.profile.position,
          bio: settings.profile.bio,
          avatar: settings.profile.avatar,
        };
        
        // Update the field that was just changed
        currentProfile[field as keyof typeof currentProfile] = value;
        
        const hasChanges = Object.keys(originalProfile).some(key => 
          currentProfile[key as keyof typeof currentProfile] !== originalProfile[key as keyof OriginalProfile]
        );
        
        console.log('🔍 Settings: Checking changes:', {
          field,
          value,
          currentProfile,
          originalProfile,
          hasChanges
        });
        
        setHasUnsavedChanges(hasChanges);
      }
    }, 0);
  };


  const stats = [
    {
      title: 'Profile Completion',
      value: '95%',
      description: 'Almost complete',
      icon: User,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Security Score',
      value: 'Good',
      description: '2FA recommended',
      icon: Shield,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Last Activity',
      value: '2 min ago',
      description: 'Settings synchronized',
      icon: RefreshCw,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Notifications',
      value: '5 Active',
      description: 'All channels enabled',
      icon: Bell,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader
          title="Employee Settings"
          subtitle="Manage your profile, preferences, and account settings"
          icon={Settings}
          iconColor="from-blue-600 to-purple-600"
        />
        {/* Profile Header Card */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  {settings.profile.avatar ? (
                    <img 
                      src={settings.profile.avatar} 
                      alt="Profile" 
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{settings.profile.name}</h2>
                    <p className="text-lg text-muted-foreground">{settings.profile.position}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Building2 className="h-3 w-3 mr-1" />
                        {settings.profile.department}
                      </Badge>
                      <Badge variant="outline">
                        <Award className="h-3 w-3 mr-1" />
                        {settings.profile.employeeId}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasUnsavedChanges}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={() => {
                        console.log('🔍 Settings: Debug - Current state:');
                        console.log('Settings:', settings);
                        console.log('Original Profile:', originalProfile);
                        console.log('Has Unsaved Changes:', hasUnsavedChanges);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Debug
                    </Button>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Joined on {new Date(settings.profile.joinDate).toLocaleDateString()}</p>
                  <p>Last updated 2 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Settings Tabs */}
        <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-0">
            <Tabs defaultValue="profile" className="w-full">
              <div className="border-b border-slate-200/50">
                <TabsList className="h-14 w-full bg-transparent p-0">
                  <TabsTrigger 
                    value="profile" 
                    className="flex-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Profile Settings */}
              <TabsContent value="profile" className="p-8">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-slate-900">Profile Information</h3>
                      {hasUnsavedChanges && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <p className="text-muted-foreground">Update your personal and professional details</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                          <User className="h-4 w-4 inline mr-2" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={settings.profile.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="h-11 bg-white/50 border-slate-200/50 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                          <Mail className="h-4 w-4 inline mr-2" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.profile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="h-11 bg-white/50 border-slate-200/50 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                          <Phone className="h-4 w-4 inline mr-2" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={settings.profile.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="h-11 bg-white/50 border-slate-200/50 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-medium text-slate-700">
                          <Building2 className="h-4 w-4 inline mr-2" />
                          Department
                        </Label>
                        <Input
                          id="department"
                          value={settings.profile.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="h-11 bg-white/50 border-slate-200/50 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Enter your department"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position" className="text-sm font-medium text-slate-700">
                          <Award className="h-4 w-4 inline mr-2" />
                          Position
                        </Label>
                        <Input
                          id="position"
                          value={settings.profile.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          className="h-11 bg-white/50 border-slate-200/50 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Enter your position"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm font-medium text-slate-700">
                          <Edit3 className="h-4 w-4 inline mr-2" />
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          value={settings.profile.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          className="bg-white/50 border-slate-200/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                          placeholder="Tell us about yourself"
                          rows={4}
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

export default EmployeeSettingsPage;