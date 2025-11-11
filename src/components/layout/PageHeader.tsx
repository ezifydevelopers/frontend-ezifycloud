import React from 'react';
import { LucideIcon, Keyboard } from 'lucide-react';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  showStatus?: boolean;
  statusText?: string;
  statusColor?: string;
  className?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'from-green-600 to-blue-600',
  showStatus = true,
  statusText = 'System Online',
  statusColor = 'bg-green-500',
  className = '',
  children,
}) => {
  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm rounded-2xl mb-8 ${className}`}>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-2 bg-gradient-to-r ${iconColor} rounded-xl shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {children}
            <KeyboardShortcutsDialog />
            {showStatus && (
              <div className="hidden md:flex items-center space-x-2 ml-2">
                <div className={`w-3 h-3 ${statusColor} rounded-full animate-pulse`}></div>
                <span className="text-sm text-muted-foreground">{statusText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
