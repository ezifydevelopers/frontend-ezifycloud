import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SecondarySidebar from './SecondarySidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts, commonShortcuts } from '@/hooks/useKeyboardShortcuts';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(false);
  const [activeSystem, setActiveSystem] = useState<'invoice' | 'leave' | null>(null);

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === paths.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...commonShortcuts.toggleSidebar,
      action: () => setSidebarOpen(!sidebarOpen),
    },
    {
      key: 'Escape',
      action: () => {
        setMobileSidebarOpen(false);
      },
    },
  ]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Handle system sidebar opening
  useEffect(() => {
    const handleOpenSystemSidebar = (event: CustomEvent) => {
      const { systemType, href } = event.detail;
      setActiveSystem(systemType);
      setSecondarySidebarOpen(true);
      navigate(href);
    };

    window.addEventListener('openSystemSidebar', handleOpenSystemSidebar as EventListener);
    
    return () => {
      window.removeEventListener('openSystemSidebar', handleOpenSystemSidebar as EventListener);
    };
  }, [navigate]);

  // Auto-detect active system from route
  useEffect(() => {
    if (location.pathname.startsWith('/invoice-system')) {
      setActiveSystem('invoice');
      setSecondarySidebarOpen(true);
    } else if (location.pathname.startsWith('/admin/leave-management') || 
               location.pathname.startsWith('/admin/employees') ||
               location.pathname.startsWith('/admin/capacity') ||
               location.pathname.startsWith('/admin/attendance') ||
               location.pathname.startsWith('/admin/user-approvals') ||
               location.pathname.startsWith('/admin/settings') ||
               location.pathname.startsWith('/admin/salary') ||
               location.pathname.startsWith('/admin/audit-logs')) {
      // Keep leave management sidebar open for all admin pages accessible from it
      setActiveSystem('leave');
      setSecondarySidebarOpen(true);
    } else {
      setActiveSystem(null);
      setSecondarySidebarOpen(false);
    }
  }, [location.pathname]);

  // Responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar - Hidden when system sidebar is open */}
      {!secondarySidebarOpen && (
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-50 bg-background border-r transition-all duration-300',
            mobileSidebarOpen 
              ? 'translate-x-0' 
              : '-translate-x-full lg:translate-x-0',
            !sidebarOpen ? 'lg:w-20' : 'lg:w-64',
            'w-64'
          )}
        >
          <Sidebar />
        </aside>
      )}

      {/* System Sidebar - Replaces main sidebar when system is open */}
      {secondarySidebarOpen && activeSystem && (
        <>
          {/* Mobile overlay for system sidebar */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              onClick={() => {
                setSecondarySidebarOpen(false);
                setActiveSystem(null);
              }}
            />
          )}
          <aside
            className={cn(
              'fixed lg:static inset-y-0 left-0 z-50 bg-background border-r transition-all duration-300',
              'w-64',
              mobileSidebarOpen 
                ? 'translate-x-0' 
                : '-translate-x-full lg:translate-x-0'
            )}
          >
            <SecondarySidebar
              systemType={activeSystem}
              onClose={() => {
                setSecondarySidebarOpen(false);
                setActiveSystem(null);
                if (activeSystem === 'invoice') {
                  navigate('/workspaces');
                } else if (activeSystem === 'leave') {
                  navigate('/admin/settings');
                }
              }}
            />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col overflow-hidden lg:ml-0 transition-all duration-300',
        secondarySidebarOpen && 'lg:ml-0'
      )}>
        {/* Top Header Bar */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              {mobileSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Desktop Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => {
                if (secondarySidebarOpen) {
                  // If system sidebar is open, close it to show main sidebar
                  setSecondarySidebarOpen(false);
                  setActiveSystem(null);
                  navigate('/workspaces');
                } else {
                  // Toggle main sidebar
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              title={secondarySidebarOpen ? 'Back to Main Menu' : 'Toggle Sidebar'}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage className="text-sm font-medium text-gray-900">{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={crumb.href}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(crumb.href);
                          }}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!crumb.isLast && <BreadcrumbSeparator className="text-gray-400" />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">{user.name || 'User'}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1.5 py-0 h-5 capitalize"
                    >
                      {user.role || 'user'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <OfflineIndicator />
            <NotificationCenter />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;