import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Download,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Zap,
  CalendarDays,
  Clock3,
  User,
  Building2,
  Target,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'leave' | 'meeting' | 'holiday' | 'deadline';
  startDate: string;
  endDate: string;
  employee?: {
    id: string;
    name: string;
    avatar: string;
    department: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  description?: string;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  department: string;
  status: 'active' | 'on-leave' | 'offline';
  currentLeave?: {
    type: string;
    startDate: string;
    endDate: string;
  };
}

const TeamCalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedMember, setSelectedMember] = useState('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Mock data
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Alice Johnson - Annual Leave',
      type: 'leave',
      startDate: '2024-12-22',
      endDate: '2024-12-30',
      employee: {
        id: 'emp1',
        name: 'Alice Johnson',
        avatar: 'AJ',
        department: 'Engineering',
      },
      status: 'approved',
      priority: 'high',
      description: 'Christmas vacation with family',
      color: 'bg-blue-500',
    },
    {
      id: '2',
      title: 'Bob Smith - Sick Leave',
      type: 'leave',
      startDate: '2024-12-16',
      endDate: '2024-12-16',
      employee: {
        id: 'emp2',
        name: 'Bob Smith',
        avatar: 'BS',
        department: 'Marketing',
      },
      status: 'approved',
      priority: 'medium',
      description: 'Doctor appointment',
      color: 'bg-red-500',
    },
    {
      id: '3',
      title: 'Team Meeting',
      type: 'meeting',
      startDate: '2024-12-18',
      endDate: '2024-12-18',
      status: 'approved',
      priority: 'high',
      description: 'Weekly team standup',
      color: 'bg-green-500',
    },
    {
      id: '4',
      title: 'Christmas Holiday',
      type: 'holiday',
      startDate: '2024-12-25',
      endDate: '2024-12-25',
      status: 'approved',
      priority: 'high',
      description: 'Company holiday',
      color: 'bg-purple-500',
    },
    {
      id: '5',
      title: 'Project Deadline',
      type: 'deadline',
      startDate: '2024-12-31',
      endDate: '2024-12-31',
      status: 'approved',
      priority: 'high',
      description: 'Q4 Project Alpha delivery',
      color: 'bg-orange-500',
    },
  ];

  const mockTeamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'AJ',
      department: 'Engineering',
      status: 'on-leave',
      currentLeave: {
        type: 'Annual Leave',
        startDate: '2024-12-22',
        endDate: '2024-12-30',
      },
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'BS',
      department: 'Marketing',
      status: 'active',
    },
    {
      id: '3',
      name: 'Carol Davis',
      avatar: 'CD',
      department: 'HR',
      status: 'active',
    },
    {
      id: '4',
      name: 'David Wilson',
      avatar: 'DW',
      department: 'Sales',
      status: 'active',
    },
    {
      id: '5',
      name: 'Emma Brown',
      avatar: 'EB',
      department: 'Engineering',
      status: 'offline',
    },
  ];

  useEffect(() => {
    setEvents(mockEvents);
    setTeamMembers(mockTeamMembers);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'meeting':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'holiday':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'deadline':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-leave':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const filteredEvents = selectedMember === 'all' 
    ? events 
    : events.filter(event => event.employee?.id === selectedMember);

  // Mock statistics
  const stats = [
    {
      title: 'Team Members',
      value: teamMembers.length,
      description: 'Total team size',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      title: 'On Leave Today',
      value: teamMembers.filter(member => member.status === 'on-leave').length,
      description: 'Currently away',
      icon: Clock,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
    {
      title: 'Active Members',
      value: teamMembers.filter(member => member.status === 'active').length,
      description: 'Currently working',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: 'Upcoming Events',
      value: events.filter(event => new Date(event.startDate) > new Date()).length,
      description: 'This month',
      icon: Calendar,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
  ];

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Team Calendar
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Track your team's schedule, leave requests, and important events.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Team Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                  <stat.icon className={`h-6 w-6 text-white`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="hover:bg-green-50 hover:text-green-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="hover:bg-green-50 hover:text-green-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
                className="hover:bg-blue-50 hover:text-blue-700"
              >
                Today
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={view} onValueChange={(value: 'month' | 'week' | 'day') => setView(value)}>
                <SelectTrigger className="w-32 bg-white/50 border-slate-200/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-48 bg-white/50 border-slate-200/50">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xl">Team Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center font-semibold text-slate-600 text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              const isCurrentMonth = day && day.getMonth() === currentDate.getMonth();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-slate-200/50 rounded-lg ${
                    isToday 
                      ? 'bg-green-50 border-green-200' 
                      : isCurrentMonth 
                      ? 'bg-white hover:bg-slate-50' 
                      : 'bg-slate-50'
                  } transition-colors duration-200`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-green-700' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {day.getDate()}
                        </span>
                        {isToday && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${event.color} text-white`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Status & Upcoming Events */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Status */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs font-semibold">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getMemberStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                    {member.currentLeave && (
                      <p className="text-xs text-slate-500 mt-1">
                        {member.currentLeave.type}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDays className="h-5 w-5 text-purple-600" />
              </div>
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredEvents
                .filter(event => new Date(event.startDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 5)
                .map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white to-slate-50/50 border border-slate-200/50"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                      <div>
                        <p className="font-medium text-slate-900">{event.title}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(event.startDate).toLocaleDateString()}
                          {event.endDate !== event.startDate && 
                            ` - ${new Date(event.endDate).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                    <Badge className={getEventColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamCalendarPage;