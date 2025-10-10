import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Building2,
  Clock3,
  CalendarDays,
  FileText,
  Eye,
  Edit,
  Save,
  Shield,
  Award as AwardIcon,
  Trophy,
  BookOpen,
  Briefcase,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { employeeAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserType } from '@/types/auth';

interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  position: string;
  manager: string;
  joinDate: string;
  avatar: string;
  bio: string;
  skills: string[];
  certifications: string[];
  achievements: string[];
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
  };
  recentActivity: {
    id: string;
    action: string;
    date: string;
    type: 'leave' | 'profile' | 'achievement';
  }[];
}

const EmployeeProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeProfile>>({});
  const [newSkill, setNewSkill] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user !== undefined) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        console.warn('User not authenticated, skipping API calls');
        setProfile(null);
        return;
      }

      console.log('🔍 Profile: Fetching profile data...');
      console.log('🔍 Profile: Current user:', user);
      console.log('🔍 Profile: Auth token:', localStorage.getItem('token'));
      
      const response = await employeeAPI.getProfile();
      
      console.log('🔍 Profile: API response:', response);

      if (response.success && response.data) {
        console.log('✅ Profile: Setting profile data:', response.data);
        
        // Transform backend data to match frontend interface
        const profileData: EmployeeProfile = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
          address: typeof response.data.address === 'string' ? response.data.address : (response.data.address ? JSON.stringify(response.data.address) : ''),
          department: response.data.department || 'Unassigned',
          position: 'Employee', // Default position
          manager: response.data.managerName || 'No Manager',
          joinDate: response.data.joinDate || response.data.createdAt,
          avatar: response.data.avatar || response.data.name.split(' ').map((n: string) => n[0]).join(''),
          bio: response.data.bio || 'No bio available',
          skills: response.data.skills || [],
          certifications: [], // Not available in backend yet
          achievements: [], // Not available in backend yet
          leaveBalance: {
            annual: 25, // Default values - would come from leave balance API
            sick: 10,
            casual: 8,
          },
          recentActivity: [
            {
              id: '1',
              action: 'Profile updated',
              date: response.data.updatedAt || new Date().toISOString(),
              type: 'profile',
            },
          ],
        };
        
        setProfile(profileData);
        setEditData(profileData);
      } else {
        console.warn('❌ Profile: API failed or returned no data');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile',
        variant: 'destructive',
      });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Profile: Updating profile with data:', editData);
      
      const response = await employeeAPI.updateProfile({
        name: editData.name,
        phone: editData.phone,
        bio: editData.bio,
        skills: editData.skills,
        address: editData.address,
        emergencyContact: editData.emergencyContact,
      });
      
      console.log('🔍 Profile: Update response:', response);
      
      if (response.success && response.data) {
        // Transform updated data to match frontend interface
        const updatedProfile: EmployeeProfile = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone || '',
          address: typeof response.data.address === 'string' ? response.data.address : (response.data.address ? JSON.stringify(response.data.address) : ''),
          department: response.data.department || 'Unassigned',
          position: 'Employee',
          manager: response.data.managerName || 'No Manager',
          joinDate: response.data.joinDate || response.data.createdAt,
          avatar: response.data.avatar || response.data.name.split(' ').map((n: string) => n[0]).join(''),
          bio: response.data.bio || 'No bio available',
          skills: response.data.skills || [],
          certifications: profile?.certifications || [],
          achievements: profile?.achievements || [],
          leaveBalance: profile?.leaveBalance || { annual: 25, sick: 10, casual: 8 },
          recentActivity: [
            {
              id: '1',
              action: 'Profile updated',
              date: new Date().toISOString(),
              type: 'profile',
            },
            ...(profile?.recentActivity || []).slice(0, 2), // Keep last 2 activities
          ],
        };
        
        setProfile(updatedProfile);
        setEditData(updatedProfile);
        setIsEditing(false);
        setHasUnsavedChanges(false);
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
        });
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && profile) {
      const updatedSkills = [...profile.skills, newSkill.trim()];
      setProfile(prev => prev ? { ...prev, skills: updatedSkills } : null);
      setEditData(prev => ({ ...prev, skills: updatedSkills }));
      setNewSkill('');
      setHasUnsavedChanges(true);
      
      toast({
        title: 'Skill added',
        description: `${newSkill.trim()} has been added to your skills. Don't forget to save!`,
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (profile) {
      const updatedSkills = profile.skills.filter(skill => skill !== skillToRemove);
      setProfile(prev => prev ? { ...prev, skills: updatedSkills } : null);
      setEditData(prev => ({ ...prev, skills: updatedSkills }));
      setHasUnsavedChanges(true);
      
      toast({
        title: 'Skill removed',
        description: `${skillToRemove} has been removed from your skills. Don't forget to save!`,
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return CalendarDays;
      case 'profile':
        return User;
      case 'achievement':
        return CheckCircle;
      default:
        return CheckCircle;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'leave':
        return 'text-blue-600';
      case 'profile':
        return 'text-green-600';
      case 'achievement':
        return 'text-purple-600';
      default:
        return 'text-slate-600';
    }
  };

  // Calculate statistics
  const stats: never[] = [];

  if (loading && !profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Profile Not Found</h3>
          <p className="text-slate-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                    {profile.avatar}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {profile.name}
                </h1>
                <p className="text-slate-600 text-lg font-medium">{profile.position}</p>
                <p className="text-slate-500">{profile.department} • {profile.manager}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    Joined {new Date(profile.joinDate).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProfile}
                disabled={loading}
                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors duration-200"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Profile Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Profile Tabs */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <Card className="relative bg-white/90 backdrop-blur-sm border-white/30 shadow-xl rounded-3xl">
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 rounded-2xl p-1">
                <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                <TabsTrigger value="skills" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Skills & Certifications</TabsTrigger>
              </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">Personal Information</h3>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors duration-200"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700 mb-2 block">Full Name</Label>
                      <Input
                        id="name"
                        value={isEditing ? (editData.name || '') : profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700 mb-2 block">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled={true}
                        className="bg-slate-50 border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700 mb-2 block">Phone Number</Label>
                      <Input
                        id="phone"
                        value={isEditing ? (editData.phone || '') : profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-colors duration-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-slate-700 mb-2 block">Address</Label>
                      <Textarea
                        id="address"
                        value={isEditing ? (editData.address || '') : profile.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-colors duration-200"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio" className="text-sm font-medium text-slate-700 mb-2 block">Bio</Label>
                      <Textarea
                        id="bio"
                        value={isEditing ? (editData.bio || '') : profile.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-colors duration-200"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Skills & Certifications Tab */}
            <TabsContent value="skills">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">Skills & Certifications</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                      className="hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors duration-200"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditing ? 'Cancel' : 'Edit Skills'}
                    </Button>
                    {isEditing && (
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 ${hasUnsavedChanges ? 'ring-2 ring-orange-400' : ''}`}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {hasUnsavedChanges ? 'Save Skills*' : 'Save Skills'}
                      </Button>
                    )}
                  </div>
                </div>
                
                {hasUnsavedChanges && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                      <p className="text-orange-800 font-medium">
                        You have unsaved changes. Click "Save Skills" to persist your changes to the database.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-4">Technical Skills</h4>
                    
                    {/* Add Skill Input */}
                    {isEditing && (
                      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/50">
                        <div className="flex gap-3">
                          <Input
                            placeholder="Add a new skill..."
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className="flex-1 bg-white/80 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddSkill();
                              }
                            }}
                          />
                          <Button
                            onClick={handleAddSkill}
                            disabled={!newSkill.trim()}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {profile.skills.map((skill, index) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <span className="font-medium text-slate-900">{skill}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg px-3 py-1">
                              Expert
                            </Badge>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSkill(skill)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {profile.skills.length === 0 && (
                        <div className="text-center py-12">
                          <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Skills Added</h3>
                          <p className="text-slate-500">Add your technical skills to showcase your expertise.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-4">Certifications</h4>
                    <div className="space-y-3">
                      {profile.certifications.map((cert, index) => (
                        <div
                          key={cert}
                          className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="p-2 bg-green-100 rounded-xl">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="font-medium text-slate-900">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Achievements</h4>
                  <div className="space-y-3">
                    {profile.achievements.map((achievement, index) => (
                      <div
                        key={achievement}
                        className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50 hover:shadow-md transition-all duration-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="p-2 bg-yellow-100 rounded-xl">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                        </div>
                        <span className="font-medium text-slate-900">{achievement}</span>
                      </div>
                    ))}
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

export default EmployeeProfilePage;