import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  Clock,
  UserCheck,
  LogOut,
  Shield,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Bell,
  HelpCircle,
  Zap,
  Target,
  Activity,
  Award,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string | number;
  description?: string;
  isNew?: boolean;
  isComingSoon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const adminNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { 
          icon: LayoutDashboard, 
          label: 'Dashboard', 
          href: '/admin/dashboard',
          description: 'System overview and analytics'
        },
      ]
    },
    {
      title: 'Management',
      items: [
        { 
          icon: Users, 
          label: 'Employees', 
          href: '/admin/employees',
          badge: 156,
          description: 'Manage team members'
        },
        { 
          icon: FileText, 
          label: 'Leave Requests', 
          href: '/admin/leave-requests',
          badge: 12,
          description: 'Review and approve requests'
        },
        { 
          icon: BookOpen, 
          label: 'Leave Policies', 
          href: '/admin/policies',
          description: 'Configure leave rules'
        },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { 
          icon: BarChart3, 
          label: 'Reports', 
          href: '/admin/reports',
          description: 'Generate insights and reports'
        },
        { 
          icon: Shield, 
          label: 'Audit Logs', 
          href: '/admin/audit-logs',
          badge: 3,
          description: 'Track system activities'
        },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { 
          icon: Settings, 
          label: 'Settings', 
          href: '/admin/settings',
          description: 'System configuration'
        },
      ]
    }
  ];

  const managerNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { 
          icon: LayoutDashboard, 
          label: 'Dashboard', 
          href: '/manager/dashboard',
          description: 'Team overview and metrics'
        },
      ]
    },
    {
      title: 'Team Management',
      items: [
        { 
          icon: FileText, 
          label: 'Approvals', 
          href: '/manager/approvals',
          badge: 8,
          description: 'Review leave requests'
        },
        { 
          icon: Users, 
          label: 'Team Overview', 
          href: '/manager/team',
          description: 'Manage team members'
        },
        { 
          icon: Calendar, 
          label: 'Team Calendar', 
          href: '/manager/calendar',
          description: 'View team schedule'
        },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { 
          icon: Settings, 
          label: 'Settings', 
          href: '/manager/settings',
          description: 'Team settings'
        },
      ]
    }
  ];

  const employeeNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { 
          icon: LayoutDashboard, 
          label: 'Dashboard', 
          href: '/employee/dashboard',
          description: 'Personal overview'
        },
      ]
    },
    {
      title: 'Leave Management',
      items: [
        { 
          icon: FileText, 
          label: 'Request Leave', 
          href: '/employee/request',
          description: 'Submit new requests'
        },
        { 
          icon: Clock, 
          label: 'Leave History', 
          href: '/employee/history',
          description: 'View past requests'
        },
        { 
          icon: Calendar, 
          label: 'Calendar', 
          href: '/employee/calendar',
          description: 'Personal schedule'
        },
      ]
    },
    {
      title: 'Profile',
      items: [
        { 
          icon: UserCheck, 
          label: 'Profile', 
          href: '/employee/profile',
          description: 'Manage your profile'
        },
        { 
          icon: Settings, 
          label: 'Settings', 
          href: '/employee/settings',
          description: 'Account preferences'
        },
      ]
    }
  ];

  const getNavSections = () => {
    switch (user?.role) {
      case 'admin':
        return adminNavSections;
      case 'manager':
        return managerNavSections;
      case 'employee':
        return employeeNavSections;
      default:
        return [];
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return 'from-blue-500 to-purple-600';
      case 'manager':
        return 'from-green-500 to-blue-600';
      case 'employee':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return Shield;
      case 'manager':
        return Users;
      case 'employee':
        return UserCheck;
      default:
        return Building2;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <TooltipProvider>
      <div className={cn(
        'flex flex-col h-full bg-white/80 backdrop-blur-sm border-r border-white/20 shadow-lg transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}>
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300',
              `bg-gradient-to-br ${getRoleColor()}`
            )}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <h2 className="font-bold text-xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Ezify Cloud
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <RoleIcon className="w-3 h-3 text-slate-500" />
                  <p className="text-xs text-slate-500 capitalize font-medium">{user?.role} Portal</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0 hover:bg-slate-100/50"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-6">
            {getNavSections().map((section, sectionIndex) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const isItemActive = isActive(item.href);
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <NavLink to={item.href}>
                            {({ isActive: navIsActive }) => (
                              <div
                                className={cn(
                                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                  'hover:scale-[1.02] hover:shadow-md',
                                  isItemActive || navIsActive
                                    ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`
                                    : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                                )}
                                style={{ animationDelay: `${(sectionIndex * 100) + (itemIndex * 50)}ms` }}
                              >
                                <div className={cn(
                                  'p-1.5 rounded-lg transition-all duration-200',
                                  isItemActive || navIsActive
                                    ? 'bg-white/20'
                                    : 'group-hover:bg-slate-200/50'
                                )}>
                                  <item.icon className="w-4 h-4" />
                                </div>
                                {!isCollapsed && (
                                  <>
                                    <span className="flex-1 truncate">{item.label}</span>
                                    {item.badge && (
                                      <Badge 
                                        variant="secondary" 
                                        className={cn(
                                          'text-xs px-2 py-0.5',
                                          isItemActive || navIsActive
                                            ? 'bg-white/20 text-white border-white/30'
                                            : 'bg-slate-200 text-slate-700'
                                        )}
                                      >
                                        {item.badge}
                                      </Badge>
                                    )}
                                    {item.isNew && (
                                      <Badge 
                                        variant="default" 
                                        className="text-xs px-2 py-0.5 bg-green-500 text-white"
                                      >
                                        New
                                      </Badge>
                                    )}
                                    {item.isComingSoon && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs px-2 py-0.5 text-slate-500"
                                      >
                                        Soon
                                      </Badge>
                                    )}
                                  </>
                                )}
                                {(isItemActive || navIsActive) && (
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
                                )}
                              </div>
                            )}
                          </NavLink>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              {item.description && (
                                <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="px-4 py-4 border-t border-white/20">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
              >
                <Plus className="w-4 h-4" />
                New Request
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-slate-600 hover:bg-slate-100/50 hover:text-slate-900"
              >
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </div>
        )}

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/50">
            <Avatar className="h-10 w-10 border-2 border-white shadow-md">
              <AvatarFallback className={`bg-gradient-to-br ${getRoleColor()} text-white font-semibold`}>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">Online</span>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm border-white/20">
                  <DropdownMenuItem className="hover:bg-slate-50">
                    <UserCheck className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-slate-50">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-slate-50">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-slate-600 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;