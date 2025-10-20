import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Calendar, Heart, Coffee, Baby, User, AlertTriangle } from 'lucide-react';

interface EnhancedSelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const EnhancedSelectItem: React.FC<EnhancedSelectItemProps> = ({ 
  value, 
  children, 
  className 
}) => {
  return (
    <SelectItem 
      value={value} 
      className={cn(
        "cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <span className="font-medium">{children}</span>
    </SelectItem>
  );
};

interface EnhancedSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select an option",
  children,
  className,
  triggerClassName,
  contentClassName,
  disabled = false
}) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger 
        className={cn(
          "w-full h-11 px-3 py-2 border border-slate-200 rounded-md bg-white text-sm transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none shadow-sm",
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent 
        className={cn(
          "bg-white border border-slate-200 rounded-md shadow-lg z-50 p-1 min-w-[200px]",
          contentClassName
        )}
      >
        {children}
      </SelectContent>
    </Select>
  );
};

// Special component for leave types with icons
interface LeaveTypeSelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const LeaveTypeSelectItem: React.FC<LeaveTypeSelectItemProps> = ({ 
  value, 
  children, 
  className 
}) => {
  const getIcon = (leaveType: string) => {
    switch (leaveType) {
      case 'annual':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'sick':
        return <Heart className="h-4 w-4 text-red-600" />;
      case 'casual':
        return <Coffee className="h-4 w-4 text-green-600" />;
      case 'maternity':
        return <Baby className="h-4 w-4 text-pink-600" />;
      case 'paternity':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <SelectItem 
      value={value} 
      className={cn(
        "cursor-pointer relative flex w-full select-none items-center rounded-sm py-2.5 pl-8 pr-2 text-sm outline-none transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700 data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
    >
      <div className="flex items-center space-x-2">
        {getIcon(value)}
        <span className="font-medium">{children}</span>
      </div>
    </SelectItem>
  );
};

export { EnhancedSelect, EnhancedSelectItem, LeaveTypeSelectItem };
