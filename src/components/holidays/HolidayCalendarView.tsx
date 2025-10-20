import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Eye,
  Flag,
  Building2,
  Heart,
  Star,
  RefreshCw
} from 'lucide-react';
import CalendarComponent from '@/components/ui/Calendar';
import { adminAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'public' | 'company' | 'religious' | 'national';
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface HolidayCalendarViewProps {
  className?: string;
}

const HolidayCalendarView: React.FC<HolidayCalendarViewProps> = ({ className }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Generate year options (current year ± 2 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        limit: '100'
      });

      const response = await adminAPI.getHolidays(params.toString());
      
      if (response.success && response.data) {
        const holidaysData = Array.isArray(response.data) ? response.data : response.data.data || [];
        setHolidays(holidaysData as Holiday[]);
      } else {
        console.error('Error fetching holidays:', response);
        toast({
          title: 'Error',
          description: response.message || 'Failed to fetch holidays',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch holidays',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const filteredHolidays = holidays.filter(holiday => {
    if (filterType === 'all') return true;
    return holiday.type === filterType;
  });

  const getHolidayTypeIcon = (type: string) => {
    switch (type) {
      case 'national':
        return Flag;
      case 'company':
        return Building2;
      case 'religious':
        return Heart;
      case 'public':
        return Calendar;
      default:
        return Star;
    }
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'national':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'company':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'religious':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'public':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHolidaysForSelectedDate = () => {
    return filteredHolidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === selectedDate.toDateString();
    });
  };

  const getUpcomingHolidays = () => {
    const today = new Date();
    return filteredHolidays
      .filter(holiday => new Date(holiday.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const getHolidaysByMonth = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return months.map(month => {
      const monthHolidays = filteredHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate.getMonth() === month;
      });
      return {
        month,
        holidays: monthHolidays,
        count: monthHolidays.length
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-slate-600">Loading holiday calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-blue-600" />
                Holiday Calendar
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Visual overview of all holidays and events
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-r-none"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar View */}
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {viewMode === 'calendar' ? 'Calendar View' : 'List View'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'calendar' ? (
                <CalendarComponent
                  value={selectedDate}
                  onChange={setSelectedDate}
                  holidays={filteredHolidays}
                  className="w-full"
                />
              ) : (
                <div className="space-y-4">
                  {filteredHolidays.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">No holidays found for the selected criteria</p>
                    </div>
                  ) : (
                    filteredHolidays.map(holiday => {
                      const Icon = getHolidayTypeIcon(holiday.type);
                      return (
                        <div key={holiday.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <Icon className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{holiday.name}</h3>
                              <p className="text-sm text-slate-500">
                                {new Date(holiday.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              {holiday.description && (
                                <p className="text-sm text-slate-600 mt-1">{holiday.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getHolidayTypeColor(holiday.type)}>
                              {holiday.type}
                            </Badge>
                            {holiday.isRecurring && (
                              <Badge variant="outline" className="text-xs">
                                Recurring
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Holidays */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Selected Date</CardTitle>
              <p className="text-sm text-slate-600">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </CardHeader>
            <CardContent>
              {getHolidaysForSelectedDate().length === 0 ? (
                <p className="text-slate-500 text-sm">No holidays on this date</p>
              ) : (
                <div className="space-y-3">
                  {getHolidaysForSelectedDate().map(holiday => {
                    const Icon = getHolidayTypeIcon(holiday.type);
                    return (
                      <div key={holiday.id} className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon className="h-4 w-4 text-slate-600" />
                          <span className="font-medium text-sm">{holiday.name}</span>
                        </div>
                        <Badge className={getHolidayTypeColor(holiday.type)} size="sm">
                          {holiday.type}
                        </Badge>
                        {holiday.description && (
                          <p className="text-xs text-slate-600 mt-2">{holiday.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Holidays */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent>
              {getUpcomingHolidays().length === 0 ? (
                <p className="text-slate-500 text-sm">No upcoming holidays</p>
              ) : (
                <div className="space-y-3">
                  {getUpcomingHolidays().map(holiday => {
                    const Icon = getHolidayTypeIcon(holiday.type);
                    const daysUntil = Math.ceil((new Date(holiday.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={holiday.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-slate-600" />
                            <span className="font-medium text-sm">{holiday.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">{daysUntil} days</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <Badge className={getHolidayTypeColor(holiday.type)} size="sm">
                          {holiday.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getHolidaysByMonth().map(({ month, count }) => {
                  const monthName = new Date(0, month).toLocaleDateString('en-US', { month: 'short' });
                  return (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{monthName}</span>
                      <Badge variant="outline" className="text-xs">
                        {count} holidays
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendarView;
