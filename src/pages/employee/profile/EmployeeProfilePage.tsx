import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  Target,
  Award,
  Building2,
  Clock3,
  CalendarDays,
  FileText,
  Eye,
  Edit,
  Save,
  Camera,
  Shield,
  Award as AwardIcon,
  Trophy,
  BookOpen,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  performance: {
    rating: number;
    goals: number;
    completedGoals: number;
    efficiency: number;
  };
  recentActivity: {
    id: string;
    action: string;
    date: string;
    type: 'leave' | 'profile' | 'achievement';
  }[];
}

const EmployeeProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<EmployeeProfile>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State 12345',
    department: 'Engineering',
    position: 'Senior Developer',
    manager: 'Jane Manager',
    joinDate: '2022-03-15',
    avatar: 'JD',
    bio: 'Passionate software developer with 5+ years of experience in full-stack development. Always eager to learn new technologies and contribute to innovative projects.',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
    certifications: ['AWS Certified Developer', 'Google Cloud Professional', 'Certified Scrum Master'],
    achievements: ['Employee of the Month - March 2024', 'Innovation Award - Q2 2024', 'Team Player Award - 2023'],
    leaveBalance: {
      annual: 13,
      sick: 8,
      casual: 5,
    },
    performance: {
      rating: 4.7,
      goals: 8,
      completedGoals: 6,
      efficiency: 92,
    },
    recentActivity: [
      {
        id: '1',
        action: 'Submitted annual leave request',
        date: '2024-12-15T10:30:00Z',
        type: 'leave',
      },
      {
        id: '2',
        action: 'Updated profile information',
        date: '2024-12-10T14:20:00Z',
        type: 'profile',
      },
      {
        id: '3',
        action: 'Received Employee of the Month award',
        date: '2024-12-01T09:00:00Z',
        type: 'achievement',
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(profile);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Profile data is already initialized
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfile(editData);
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return CalendarDays;
      case 'profile':
        return User;
      case 'achievement':
        return Award;
      default:
        return Activity;
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

  // Mock statistics
  const stats = [
    {
      title: 'Performance Rating',
      value: profile.performance.rating,
      description: 'Out of 5.0',
      icon: Star,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
      trend: { value: 8.3, isPositive: true },
    },
    {
      title: 'Goals Completed',
      value: `${profile.performance.completedGoals}/${profile.performance.goals}`,
      description: 'This year',
      icon: Target,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: 'Efficiency',
      value: `${profile.performance.efficiency}%`,
      description: 'Work efficiency',
      icon: Activity,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      title: 'Years of Service',
      value: Math.floor((new Date().getTime() - new Date(profile.joinDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      description: 'With company',
      icon: Award,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-2xl font-bold">
                    {profile.avatar}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {profile.name}
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">{profile.position}</p>
                <p className="text-slate-600">{profile.department} • {profile.manager}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </Badge>
                  <Badge variant="outline">
                    Joined {new Date(profile.joinDate).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
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

      {/* Profile Tabs */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills & Certifications</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="hover:bg-purple-50 hover:text-purple-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={isEditing ? editData.name : profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={isEditing ? editData.email : profile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={isEditing ? editData.phone : profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/50 border-slate-200/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={isEditing ? editData.address : profile.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/50 border-slate-200/50"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={isEditing ? editData.bio : profile.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        className="bg-white/50 border-slate-200/50"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                <h3 className="text-lg font-semibold">Skills & Certifications</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-4">Technical Skills</h4>
                    <div className="space-y-3">
                      {profile.skills.map((skill, index) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <span className="font-medium text-slate-900">{skill}</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Expert
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-4">Certifications</h4>
                    <div className="space-y-3">
                      {profile.certifications.map((cert, index) => (
                        <div
                          key={cert}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Shield className="h-4 w-4 text-green-600" />
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
                        className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                        </div>
                        <span className="font-medium text-slate-900">{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Performance Overview</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-gradient-to-r from-white to-slate-50/50 border-slate-200/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Performance Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-slate-900 mb-2">
                          {profile.performance.rating}
                        </div>
                        <div className="flex items-center justify-center space-x-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(profile.performance.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">Out of 5.0 stars</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-r from-white to-slate-50/50 border-slate-200/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-500" />
                        Goals Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Completed Goals</span>
                          <span>{profile.performance.completedGoals}/{profile.performance.goals}</span>
                        </div>
                        <Progress 
                          value={(profile.performance.completedGoals / profile.performance.goals) * 100} 
                          className="h-2 bg-slate-200"
                        />
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-900">
                            {Math.round((profile.performance.completedGoals / profile.performance.goals) * 100)}%
                          </div>
                          <p className="text-sm text-slate-500">Completion rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-gradient-to-r from-white to-slate-50/50 border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-500" />
                      Work Efficiency
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency Score</span>
                        <span>{profile.performance.efficiency}%</span>
                      </div>
                      <Progress 
                        value={profile.performance.efficiency} 
                        className="h-3 bg-slate-200"
                      />
                      <div className="text-center">
                        <p className="text-sm text-slate-500">
                          {profile.performance.efficiency >= 90 ? 'Excellent' : 
                           profile.performance.efficiency >= 80 ? 'Good' : 
                           profile.performance.efficiency >= 70 ? 'Average' : 'Needs Improvement'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <div className="space-y-4">
                  {profile.recentActivity.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`p-2 rounded-lg bg-slate-100`}>
                          <IconComponent className={`h-4 w-4 ${getActivityColor(activity.type)}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{activity.action}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                          {activity.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeProfilePage;