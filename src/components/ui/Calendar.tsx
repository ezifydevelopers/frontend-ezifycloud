import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  holidays?: Array<{
    id: string;
    name: string;
    date: string;
    type: 'public' | 'company' | 'religious' | 'national';
    isRecurring: boolean;
  }>;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  value = new Date(),
  onChange,
  holidays = [],
  className
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(value);

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return value && date.toDateString() === value.toDateString();
  };

  const getHolidaysForDate = (date: Date) => {
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === date.toDateString();
    });
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'public':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'company':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'religious':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'national':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Names Header */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-24 border-r border-b" />;
          }

          const dayHolidays = getHolidaysForDate(date);
          const isCurrentDay = isToday(date);
          const isSelectedDay = isSelected(date);

          return (
            <div
              key={index}
              className={cn(
                'h-24 border-r border-b p-1 cursor-pointer hover:bg-gray-50 transition-colors',
                isCurrentDay && 'bg-blue-50',
                isSelectedDay && 'bg-blue-100 ring-2 ring-blue-500'
              )}
              onClick={() => onChange?.(date)}
            >
              <div className="flex flex-col h-full">
                {/* Day Number */}
                <div className={cn(
                  'text-sm font-medium mb-1',
                  isCurrentDay && 'text-blue-600',
                  isSelectedDay && 'text-blue-700'
                )}>
                  {date.getDate()}
                </div>

                {/* Holidays */}
                <div className="flex-1 space-y-1">
                  {dayHolidays.slice(0, 2).map(holiday => (
                    <div
                      key={holiday.id}
                      className={cn(
                        'text-xs px-1 py-0.5 rounded border truncate',
                        getHolidayTypeColor(holiday.type)
                      )}
                      title={holiday.name}
                    >
                      {holiday.name}
                    </div>
                  ))}
                  {dayHolidays.length > 2 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayHolidays.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
