import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { cn } from '@/lib/utils';
import { adminAPI, managerAPI } from '@/lib/api';
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Clock,
  UserCheck,
  LogOut,
  Shield,
  BookOpen,
  Calendar,
  DollarSign,
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
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Menu,
  X,
  User,
  User as UserIcon,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  isSystem?: boolean;
  systemType?: 'invoice' | 'leave';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const { dashboardData } = useDashboard();
  const location = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarStats, setSidebarStats] = useState({
    totalEmployees: 0,
    pendingRequests: 0,
    auditLogs: 0,
    teamMembers: 0
  });

  // Debug logs removed for production

  // Update sidebar stats when dashboard data changes
  useEffect(() => {
    if (dashboardData?.stats) {
      setSidebarStats(prev => ({
        ...prev,
        totalEmployees: dashboardData.stats.totalEmployees || 0,
        pendingRequests: dashboardData.stats.pendingLeaveRequests || 0,
      }));
    }
  }, [dashboardData]);

  // Fetch sidebar stats for admin and manager users (fallback)
  useEffect(() => {
    const fetchSidebarStats = async () => {
      if (user?.role === 'admin') {
        try {
          const quickStatsResponse = await adminAPI.getQuickStats();

          if (quickStatsResponse.success) {
            setSidebarStats(prev => ({
              ...prev,
              totalEmployees: quickStatsResponse.data.totalEmployees || 0,
              pendingRequests: quickStatsResponse.data.pendingRequests || 0,
            }));
          }
        } catch (error) {
          // Silently fail for connection errors - backend might not be running
          if (error instanceof Error && (error as any).isConnectionError) {
            // Backend not running - this is expected in development
            return;
          }
          console.error('Error fetching admin sidebar stats:', error);
        }
      } else if (user?.role === 'manager') {
        try {
          const dashboardStatsResponse = await managerAPI.getDashboardStats();
          await new Promise(resolve => setTimeout(resolve, 100));
          const teamStatsResponse = await managerAPI.getTeamStats();

          if (dashboardStatsResponse.success) {
            setSidebarStats(prev => ({
              ...prev,
              totalEmployees: 0,
              pendingRequests: dashboardStatsResponse.data.pendingApprovals || 0,
              teamMembers: dashboardStatsResponse.data.teamSize || 0
            }));
          }
        } catch (error) {
          console.error('Error fetching manager sidebar stats:', error);
        }
      }
    };

    fetchSidebarStats();
  }, [user?.role]);

  const adminNavSections: NavSection[] = [
    {
      title: 'Systems',
      items: [
        {
          icon: FileText,
          label: 'Invoice System (WorkSpace)',
          href: '/invoice-system',
          description: 'Manage invoices and payments',
          isSystem: true,
          systemType: 'invoice'
        },
        {
          icon: Calendar,
          label: 'Leave Management',
          href: '/admin/leave-management',
          description: 'Manage leave requests, policies, and holidays',
          isSystem: true,
          systemType: 'leave'
        },
      ]
    },
    {
      title: 'User Management',
      items: [
        {
          icon: UserCheck,
          label: 'User Approvals',
          href: '/admin/user-approvals',
          description: 'Approve or reject user access requests',
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
      title: 'Dashboard',
      items: [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          href: '/manager/dashboard',
          description: 'Overview and quick stats'
        },
      ]
    },
    {
      title: 'Team Management',
      items: [
        {
          icon: Users,
          label: 'Team Overview',
          href: '/manager/team',
          description: 'View all team members and employees'
        },
        {
          icon: UserCheck,
          label: 'Leave Approvals',
          href: '/manager/approvals',
          description: 'Review and approve team leave requests',
          badge: sidebarStats.pendingRequests > 0 ? sidebarStats.pendingRequests : undefined
        },
        {
          icon: UserIcon,
          label: 'User Approvals',
          href: '/manager/user-approvals',
          description: 'Approve new user access requests',
        },
        {
          icon: Target,
          label: 'Team Capacity',
          href: '/manager/capacity',
          description: 'View team capacity and workload'
        },
      ]
    },
    {
      title: 'My Leave',
      items: [
        {
          icon: FileText,
          label: 'Request Leave',
          href: '/manager/request-leave',
          description: 'Submit a new leave request'
        },
        {
          icon: Clock,
          label: 'Leave History',
          href: '/manager/leave-history',
          description: 'View your leave request history'
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
      title: 'Dashboard',
      items: [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          href: '/employee/dashboard',
          description: 'Overview and quick stats'
        },
      ]
    },
    {
      title: 'Leave Management',
      items: [
        {
          icon: FileText,
          label: 'Request Leave',
          href: '/employee/request-leave',
          description: 'Submit a new leave request'
        },
        {
          icon: Clock,
          label: 'Leave History',
          href: '/employee/leave-history',
          description: 'View your leave request history'
        },
        {
          icon: BarChart3,
          label: 'Leave Reports',
          href: '/employee/leave-reports',
          description: 'View comprehensive leave reports and statistics'
        },
      ]
    },
    {
      title: 'Profile & Settings',
      items: [
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
    const sections = (() => {
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
    })();

    // Filter out User Approvals items and remove empty sections
    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          !item.href.includes('user-approvals') && item.label !== 'User Approvals'
        )
      }))
      .filter(section => section.items.length > 0);
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
                          {item.isSystem ? (
                            <div
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('openSystemSidebar', { 
                                  detail: { systemType: item.systemType, href: item.href }
                                }));
                              }}
                              className={cn(
                                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                                'hover:scale-[1.02] hover:shadow-md',
                                isItemActive
                                  ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`
                                  : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900'
                              )}
                              style={{ animationDelay: `${(sectionIndex * 100) + (itemIndex * 50)}ms` }}
                            >
                              <div className={cn(
                                'p-1.5 rounded-lg transition-all duration-200',
                                isItemActive
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
                                        isItemActive
                                          ? 'bg-white/20 text-white border-white/30'
                                          : 'bg-slate-200 text-slate-700'
                                      )}
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </>
                              )}
                              {isItemActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
                              )}
                            </div>
                          ) : (
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
                          )}
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
          
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-slate-600 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              {/* Theme toggle removed - light mode only */}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;