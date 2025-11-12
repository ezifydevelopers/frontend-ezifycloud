import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Receipt,
  CreditCard,
  TrendingUp,
  BarChart3,
  Settings,
  Calendar,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Building2,
  BookOpen,
  Users,
  Flag,
  PlusCircle,
  Target,
  Activity,
  Shield,
  FileSearch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SecondarySidebarProps {
  systemType: 'invoice' | 'leave';
  onClose: () => void;
  className?: string;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string | number;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SecondarySidebar: React.FC<SecondarySidebarProps> = ({ systemType, onClose, className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const invoiceNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          href: '/invoice-system/dashboard',
          description: 'Invoice overview and analytics'
        },
        {
          icon: Building2,
          label: 'Workspaces',
          href: '/invoice-system/workspaces',
          description: 'Manage invoice workspaces'
        },
      ]
    },
    {
      title: 'Invoices',
      items: [
        {
          icon: FileText,
          label: 'All Invoices',
          href: '/invoice-system/invoices',
          description: 'View and manage all invoices'
        },
        {
          icon: Receipt,
          label: 'Create Invoice',
          href: '/invoice-system/invoices/create',
          description: 'Create a new invoice'
        },
        {
          icon: CreditCard,
          label: 'Payments',
          href: '/invoice-system/payments',
          description: 'Track payments and transactions'
        },
        {
          icon: DollarSign,
          label: 'Estimates',
          href: '/invoice-system/estimates',
          description: 'Manage estimates and quotes'
        },
      ]
    },
    {
      title: 'Reports & Analytics',
      items: [
        {
          icon: BarChart3,
          label: 'Reports',
          href: '/invoice-system/reports',
          description: 'Generate and view reports'
        },
        {
          icon: TrendingUp,
          label: 'Analytics',
          href: '/invoice-system/analytics',
          description: 'View analytics and insights'
        },
      ]
    },
    {
      title: 'Configuration',
      items: [
        {
          icon: Settings,
          label: 'Settings',
          href: '/invoice-system/settings',
          description: 'Invoice system settings'
        },
      ]
    }
  ];

  const leaveNavSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          href: '/admin/leave-management/dashboard',
          description: 'Leave management overview'
        },
      ]
    },
    {
      title: 'Leave Management',
      items: [
        {
          icon: FileText,
          label: 'Leave Requests',
          href: '/admin/leave-management/requests',
          description: 'Manage all leave requests'
        },
        {
          icon: BookOpen,
          label: 'Leave Policies',
          href: '/admin/leave-management/policies',
          description: 'Configure leave policies'
        },
        {
          icon: Flag,
          label: 'Holidays',
          href: '/admin/leave-management/holidays',
          description: 'Manage public holidays'
        },
        {
          icon: DollarSign,
          label: 'Paid & Unpaid Leaves',
          href: '/admin/leave-management/paid-unpaid-leaves',
          description: 'View detailed paid and unpaid leave statistics'
        },
      ]
    },
    {
      title: 'User Management',
      items: [
        {
          icon: Users,
          label: 'Employees',
          href: '/admin/employees',
          description: 'Manage employees and users'
        },
        {
          icon: UserCheck,
          label: 'User Approvals',
          href: '/admin/user-approvals',
          description: 'Approve or reject user access requests'
        },
      ]
    },
    {
      title: 'Capacity & Attendance',
      items: [
        {
          icon: Target,
          label: 'Office Capacity',
          href: '/admin/capacity',
          description: 'Manage office capacity and availability'
        },
        {
          icon: Activity,
          label: 'Attendance',
          href: '/admin/attendance',
          description: 'View and manage attendance records'
        },
      ]
    },
    {
      title: 'Reports & Analytics',
      items: [
        {
          icon: BarChart3,
          label: 'Leave Reports',
          href: '/admin/leave-management/reports',
          description: 'View leave analytics and reports'
        },
      ]
    },
    {
      title: 'Additional Features',
      items: [
        {
          icon: DollarSign,
          label: 'Salary Management',
          href: '/admin/salary',
          description: 'Manage employee salaries and payroll'
        },
        {
          icon: Shield,
          label: 'Audit Logs',
          href: '/admin/audit-logs',
          description: 'View system audit logs and security events'
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
          description: 'System configuration and settings'
        },
      ]
    }
  ];

  const getNavSections = () => {
    const sections = systemType === 'leave' ? leaveNavSections : invoiceNavSections;
    
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

  const getSystemName = () => {
    if (systemType === 'leave') {
      return 'Leave Management';
    }
    return 'Invoice System';
  };

  const getSystemColor = () => {
    if (systemType === 'leave') {
      return 'from-green-500 to-emerald-600';
    }
    return 'from-blue-500 to-purple-600';
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navSections = getNavSections();

  return (
    <TooltipProvider>
      <div className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 w-64',
        className
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Back to Main Menu"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shadow-sm',
              `bg-gradient-to-br ${getSystemColor()}`
            )}>
              {systemType === 'invoice' ? (
                <FileText className="w-4 h-4 text-white" />
              ) : systemType === 'leave' ? (
                <Calendar className="w-4 h-4 text-white" />
              ) : (
                <FileText className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 truncate">
                {getSystemName()}
              </h3>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isItemActive = isActive(item.href);
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <NavLink to={item.href}>
                            {({ isActive: navIsActive }) => (
                              <div
                                className={cn(
                                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                  'hover:scale-[1.02] hover:shadow-sm',
                                  isItemActive || navIsActive
                                    ? `bg-gradient-to-r ${getSystemColor()} text-white shadow-md`
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                )}
                              >
                                <div className={cn(
                                  'p-1.5 rounded-md transition-all duration-200',
                                  isItemActive || navIsActive
                                    ? 'bg-white/20'
                                    : 'group-hover:bg-gray-200/50'
                                )}>
                                  <item.icon className="w-4 h-4" />
                                </div>
                                <span className="flex-1 truncate">{item.label}</span>
                                {item.badge !== undefined && (
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      'text-xs px-2 py-0.5',
                                      isItemActive || navIsActive
                                        ? 'bg-white/20 text-white border-white/30'
                                        : 'bg-gray-200 text-gray-700'
                                    )}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                                {(isItemActive || navIsActive) && (
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
                                )}
                              </div>
                            )}
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-gray-300 mt-1">{item.description}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};

export default SecondarySidebar;

