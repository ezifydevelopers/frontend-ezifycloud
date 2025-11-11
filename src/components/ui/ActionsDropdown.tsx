import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, XCircle, CheckCircle } from 'lucide-react';

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

export interface ActionsDropdownProps {
  actions: ActionItem[];
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  actions,
  disabled = false,
  size = 'sm',
  variant = 'outline',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={() => {
                console.log('🔍 ActionsDropdown: Action clicked:', action.id, action.label);
                action.onClick();
              }}
              disabled={action.disabled}
              className={`cursor-pointer ${
                action.variant === 'destructive' 
                  ? 'text-red-600 focus:text-red-600' 
                  : ''
              }`}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Predefined action creators for common operations
export const createEditAction = (onEdit: () => void, disabled = false): ActionItem => ({
  id: 'edit',
  label: 'Edit',
  icon: <Edit className="h-4 w-4" />,
  onClick: onEdit,
  disabled
});

export const createDeleteAction = (onDelete: () => void, disabled = false): ActionItem => ({
  id: 'delete',
  label: 'Delete',
  icon: <Trash2 className="h-4 w-4" />,
  onClick: onDelete,
  variant: 'destructive',
  disabled
});

export const createDeactivateAction = (onDeactivate: () => void, disabled = false): ActionItem => ({
  id: 'deactivate',
  label: 'Deactivate',
  icon: <XCircle className="h-4 w-4" />,
  onClick: onDeactivate,
  disabled
});

export const createActivateAction = (onActivate: () => void, disabled = false): ActionItem => ({
  id: 'activate',
  label: 'Activate',
  icon: <CheckCircle className="h-4 w-4" />,
  onClick: onActivate,
  disabled
});

export const createToggleStatusAction = (
  isActive: boolean, 
  onToggle: () => void, 
  disabled = false
): ActionItem => ({
  id: 'toggle-status',
  label: isActive ? 'Deactivate' : 'Activate',
  icon: isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
  onClick: onToggle,
  disabled
});

export default ActionsDropdown;
