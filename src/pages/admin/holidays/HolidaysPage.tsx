import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  CalendarDays,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Building2,
  Heart,
  Crown,
  Shield,
  Zap,
  Target,
  Award,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  HelpCircle,
  Bell,
  User,
  Users,
  FileText,
  BookOpen,
  BarChart3,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Flag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import HolidayCalendarView from '@/components/holidays/HolidayCalendarView';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'company' | 'religious' | 'public';
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface HolidayFormData {
  name: string;
  date: string;
  type: 'national' | 'company' | 'religious' | 'public';
  description: string;
  isRecurring: boolean;
  isActive: boolean;
}

const HolidaysPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: '',
    type: 'national',
    description: '',
    isRecurring: false,
    isActive: true,
  });

  // Filters and search
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
    year: 'all', // Changed to 'all' to show all years by default
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch holidays
  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 HolidaysPage: Fetching holidays...');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.type && filters.type !== 'all' && { type: filters.type }),
        ...(filters.year && { year: filters.year }),
      });

      const response = await adminAPI.getHolidays(params.toString());
      
      if (response.success && response.data) {
        const holidaysData = Array.isArray(response.data) ? response.data : response.data.data || [];
        setHolidays(holidaysData as Holiday[]);
        
        if (response.data && typeof response.data === 'object' && 'pagination' in response.data) {
          setPagination((response.data as { pagination: typeof pagination }).pagination);
        } else {
          setPagination(prev => ({
            ...prev,
            total: holidaysData.length,
            totalPages: Math.ceil(holidaysData.length / prev.limit),
          }));
        }
        
        console.log('✅ HolidaysPage: Holidays fetched successfully:', holidaysData.length);
      } else {
        console.error('❌ HolidaysPage: API response failed:', response);
        toast({
          title: 'Error',
          description: response.message || 'Failed to fetch holidays',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ HolidaysPage: Error fetching holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch holidays. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('🔍 HolidaysPage: Submitting holiday form:', formData);
      
      if (editingHoliday) {
        // Update existing holiday via API
        const updateData = {
          ...formData,
          date: formData.date // Keep as string, backend will handle conversion
        };
        const response = await adminAPI.updateHoliday(editingHoliday.id, updateData);
        
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Holiday updated successfully.',
          });
          // Refresh the holidays list
          fetchHolidays();
        } else {
          toast({
            title: 'Error',
            description: response.message || 'Failed to update holiday',
            variant: 'destructive',
          });
        }
      } else {
        // Create new holiday via API
        const createData = {
          ...formData,
          date: formData.date // Keep as string, backend will handle conversion
        };
        const response = await adminAPI.createHoliday(createData);
        
        if (response.success) {
          toast({
            title: 'Success',
            description: 'Holiday created successfully.',
          });
          // Refresh the holidays list
          fetchHolidays();
        } else {
          toast({
            title: 'Error',
            description: response.message || 'Failed to create holiday',
            variant: 'destructive',
          });
        }
      }
      
      setIsDialogOpen(false);
      setEditingHoliday(null);
      setFormData({
        name: '',
        date: '',
        type: 'national',
        description: '',
        isRecurring: false,
        isActive: true,
      });
    } catch (error) {
      console.error('❌ HolidaysPage: Error submitting holiday:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save holiday. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle edit
  const handleEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring,
      isActive: holiday.isActive,
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (holidayId: string) => {
    try {
      const response = await adminAPI.deleteHoliday(holidayId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Holiday deleted successfully.',
        });
        // Refresh the holidays list
        fetchHolidays();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete holiday',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ HolidaysPage: Error deleting holiday:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete holiday. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (holidayId: string) => {
    try {
      const holiday = holidays.find(h => h.id === holidayId);
      if (!holiday) return;
      
      const response = await adminAPI.toggleHolidayStatus(holidayId, !holiday.isActive);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Holiday status updated successfully.',
        });
        // Refresh the holidays list
        fetchHolidays();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update holiday status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ HolidaysPage: Error toggling holiday status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update holiday status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter holidays
  const filteredHolidays = holidays.filter(holiday => {
    const matchesType = filters.type === 'all' || holiday.type === filters.type;
    const matchesStatus = filters.status === 'all' || 
      (filters.status === 'active' && holiday.isActive) ||
      (filters.status === 'inactive' && !holiday.isActive);
    const matchesSearch = holiday.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      holiday.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesYear = filters.year === 'all' || new Date(holiday.date).getFullYear().toString() === filters.year;
    
    return matchesType && matchesStatus && matchesSearch && matchesYear;
  });

  // Get holiday type icon
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
        return Calendar;
    }
  };

  // Get holiday type color
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl"></div>
            <div className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-600 rounded-xl">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Holiday Management
                      </h1>
                      <p className="text-gray-600 mt-1">
                        Manage public holidays and company events
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex rounded-lg border border-gray-200 bg-white">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="rounded-r-none px-4 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                      className="rounded-l-none px-4 py-2 text-sm"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendar
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setEditingHoliday(null);
                      setFormData({
                        name: '',
                        date: '',
                        type: 'national',
                        description: '',
                        isRecurring: false,
                        isActive: true,
                      });
                      setIsDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holiday
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Holidays</p>
                    <p className="text-2xl font-bold text-gray-900">{holidays.length}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Holidays</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {holidays.filter(h => h.isActive).length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recurring</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {holidays.filter(h => h.isRecurring).length}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Year</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {holidays.filter(h => new Date(h.date).getFullYear() === new Date().getFullYear()).length}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="bg-white border border-gray-100 shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search holidays..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="religious">Religious</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fetchHolidays}
                    disabled={loading}
                    className="hover:bg-gray-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingHoliday(null);
                      setFormData({
                        name: '',
                        date: '',
                        type: 'national',
                        description: '',
                        isRecurring: false,
                        isActive: true,
                      });
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Holiday
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Holiday Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter holiday name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type *</Label>
                        <Select value={formData.type} onValueChange={(value: 'national' | 'company' | 'religious' | 'public') => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="religious">Religious</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter description"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isRecurring"
                          checked={formData.isRecurring}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                        />
                        <Label htmlFor="isRecurring">Recurring Holiday</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingHoliday ? 'Update Holiday' : 'Create Holiday'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
              </CardContent>
            </Card>
          </div>

          {/* Holidays Content */}
          {viewMode === 'calendar' ? (
            <Card className="bg-white border border-gray-100 shadow-sm">
              <HolidayCalendarView />
            </Card>
          ) : (
            <Card className="bg-white border border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Holidays ({filteredHolidays.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading holidays...</p>
                    </div>
                  </div>
                ) : filteredHolidays.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No holidays found</h3>
                    <p className="text-gray-500 mb-4">No holidays match your current filters.</p>
                    <Button
                      onClick={() => {
                        setEditingHoliday(null);
                        setFormData({
                          name: '',
                          date: '',
                          type: 'national',
                          description: '',
                          isRecurring: false,
                          isActive: true,
                        });
                        setIsDialogOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Holiday
                    </Button>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Holiday</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recurring</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHolidays.map((holiday) => {
                        const IconComponent = getHolidayTypeIcon(holiday.type);
                        const typeColor = getHolidayTypeColor(holiday.type);
                        
                        return (
                          <TableRow key={holiday.id} className="hover:bg-gray-50/50">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <IconComponent className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{holiday.name}</p>
                                  {holiday.description && (
                                    <p className="text-sm text-gray-500">{holiday.description}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {new Date(holiday.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={typeColor}>
                                {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={holiday.isActive ? 'default' : 'secondary'}>
                                {holiday.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={holiday.isRecurring ? 'default' : 'outline'}>
                                {holiday.isRecurring ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(holiday)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleStatus(holiday.id)}>
                                    {holiday.isActive ? (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(holiday.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                      </TableRow>
                    );
                  })}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    // </div>
  );
};

export default HolidaysPage;
