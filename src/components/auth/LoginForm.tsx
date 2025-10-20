import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Shield,
  Zap,
  Star,
  Award,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  Info,
  User,
  Users,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { handleFormValidationErrors } from '@/lib/formUtils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Check for validation errors first
    if (handleFormValidationErrors(errors)) {
      return;
    }
    
    try {
      setError('');
      
      // Show loading toast
      toast({
        title: 'Signing in...',
        description: 'Please wait while we authenticate your credentials.',
      });
      
      await login(data.email, data.password);
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      // Force redirect after successful login
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const demoAccounts = [
    {
      role: 'Admin',
      email: 'admin@company.com',
      description: 'Full system access',
      color: 'from-blue-500 to-purple-600',
      icon: Shield,
    },
    {
      role: 'Manager',
      email: 'manager@company.com',
      description: 'Team management',
      color: 'from-green-500 to-blue-600',
      icon: Users,
    },
    {
      role: 'Employee',
      email: 'employee@company.com',
      description: 'Personal dashboard',
      color: 'from-purple-500 to-pink-600',
      icon: User,
    },
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Leave Management',
      description: 'Request and track your leave requests'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'View detailed reports and insights'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Enterprise-grade security'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work seamlessly with your team'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '50K+' },
    { label: 'Companies', value: '500+' },
    { label: 'Uptime', value: '99.9%' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Features */}
        <div className="hidden lg:block space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Ezify Cloud
                    </h1>
                    <p className="text-slate-600">Leave Management System</p>
                  </div>
                </div>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Welcome back! Access your personalized dashboard and manage your leave requests 
                  with our intuitive and powerful platform.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-200 hover:shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-900">Platform Statistics</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stat.value}</div>
                  <div className="text-xs text-green-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-slate-600 mt-2">
                  Sign in to your leave management account
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      {...register('email')}
                      className={`pl-10 bg-white/50 border-slate-200/50 focus:border-blue-300 focus:ring-blue-200 ${
                        errors.email ? 'border-red-300 focus:border-red-300 focus:ring-red-200' : ''
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password')}
                      className={`pl-10 pr-10 bg-white/50 border-slate-200/50 focus:border-blue-300 focus:ring-blue-200 ${
                        errors.password ? 'border-red-300 focus:border-red-300 focus:ring-red-200' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    />
                    <Label htmlFor="remember" className="text-sm text-slate-600">
                      Remember me
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-slate-500">Don't have an account?</span>
                    </div>
                  </div>
                  <Link 
                    to="/signup" 
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Sign up here
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </form>

              {/* Demo Accounts - Hidden */}
              {/* <div className="mt-8 space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Demo Accounts</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Click on any account to quickly sign in
                  </p>
                </div>
                <div className="space-y-2">
                  {demoAccounts.map((account, index) => (
                    <div
                      key={account.role}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/50 border border-slate-200/50 hover:bg-slate-100/50 transition-all duration-200 cursor-pointer group"
                      onClick={() => {
                        const emailInput = document.getElementById('email') as HTMLInputElement;
                        const passwordInput = document.getElementById('password') as HTMLInputElement;
                        if (emailInput && passwordInput) {
                          emailInput.value = account.email;
                          passwordInput.value = 'password123';
                        }
                      }}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} shadow-sm group-hover:shadow-md transition-shadow`}>
                        <account.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{account.role}</p>
                          <Badge variant="outline" className="text-xs">
                            Demo
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{account.email}</p>
                        <p className="text-xs text-slate-400">{account.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    All demo accounts use password: <span className="font-mono font-medium">password123</span>
                  </p>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;