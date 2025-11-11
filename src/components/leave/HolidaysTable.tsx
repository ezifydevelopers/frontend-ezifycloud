import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Search, 
  Filter, 
  RefreshCw,
  Plus,
  Eye,
  Flag,
  Building2,
  Heart,
  Star,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import ActionsDropdown, { 
  createEditAction, 
  createDeleteAction, 
  createToggleStatusAction 
} from '@/components/ui/ActionsDropdown';
import { adminAPI } from '@/lib/api';
import { Holiday } from '@/types/api';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface HolidaysTableProps {
  showStats?: boolean;
  showFilters?: boolean;
  showCreateButton?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const HolidaysTable: React.FC<HolidaysTableProps> = ({
  showStats = true,
  showFilters = true,
  showCreateButton = true,
  onRefresh,
  className = ''
}) => {
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [processingHolidays, setProcessingHolidays] = useState<Set<string>>(new Set());
  
  // Modal and form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    type: 'public' as 'public' | 'company' | 'religious' | 'national',
    isRecurring: false,
    isActive: true
  });

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      // Build parameters carefully to avoid validation errors
      const params = new URLSearchParams({
        type: 'all',
        limit: '50',
        page: '1'
      });
      
      // Add year parameter only if it's a valid 4-digit year
      if (yearFilter && yearFilter !== 'all' && /^\d{4}$/.test(yearFilter)) {
        params.append('year', yearFilter);
      }
      
      const response = await adminAPI.getHolidays(params.toString());
      
      if (response.success && response.data) {
        const holidaysData = Array.isArray(response.data) ? response.data : response.data.data || [];
        setHolidays(holidaysData);
      } else {
        setHolidays([]);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch holidays',
        variant: 'destructive',
      });
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [yearFilter]);

  const handleEditHoliday = (holidayId: string) => {
    const holiday = holidays.find(h => h.id === holidayId);
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        description: holiday.description || '',
        date: holiday.date instanceof Date ? holiday.date.toISOString().split('T')[0] : new Date(holiday.date).toISOString().split('T')[0],
        type: holiday.type,
        isRecurring: holiday.isRecurring,
        isActive: holiday.isActive
      });
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessingHolidays(prev => new Set(prev).add(holidayId));
      
      const response = await adminAPI.deleteHoliday(holidayId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Holiday deleted successfully',
        });
        await fetchHolidays();
        onRefresh?.();
      } else {
        throw new Error(response.message || 'Failed to delete holiday');
      }
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete holiday',
        variant: 'destructive',
      });
    } finally {
      setProcessingHolidays(prev => {
        const newSet = new Set(prev);
        newSet.delete(holidayId);
        return newSet;
      });
    }
  };

  const handleToggleHolidayStatus = async (holidayId: string, currentStatus: boolean) => {
    try {
      setProcessingHolidays(prev => new Set(prev).add(holidayId));
      
      const response = await adminAPI.updateHoliday(holidayId, {
        isActive: !currentStatus
      });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Holiday ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        await fetchHolidays();
        onRefresh?.();
      } else {
        throw new Error(response.message || 'Failed to update holiday status');
      }
    } catch (error) {
      console.error('Error updating holiday status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update holiday status',
        variant: 'destructive',
      });
    } finally {
      setProcessingHolidays(prev => {
        const newSet = new Set(prev);
        newSet.delete(holidayId);
        return newSet;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      date: '',
      type: 'public',
      isRecurring: false,
      isActive: true
    });
    setEditingHoliday(null);
  };

  const handleCreateHoliday = async () => {
    try {
      const response = await adminAPI.createHoliday({
        name: formData.name,
        description: formData.description,
        date: new Date(formData.date),
        type: formData.type,
        isRecurring: formData.isRecurring
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Holiday created successfully',
        });
        setIsCreateModalOpen(false);
        resetForm();
        await fetchHolidays();
        onRefresh?.();
      } else {
        throw new Error(response.message || 'Failed to create holiday');
      }
    } catch (error) {
      console.error('Error creating holiday:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create holiday',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateHoliday = async () => {
    if (!editingHoliday) return;

    try {
      const response = await adminAPI.updateHoliday(editingHoliday.id, {
        name: formData.name,
        description: formData.description,
        date: new Date(formData.date),
        type: formData.type,
        isRecurring: formData.isRecurring,
        isActive: formData.isActive
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Holiday updated successfully',
        });
        setIsEditModalOpen(false);
        resetForm();
        await fetchHolidays();
        onRefresh?.();
      } else {
        throw new Error(response.message || 'Failed to update holiday');
      }
    } catch (error) {
      console.error('Error updating holiday:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update holiday',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'public':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'company':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'religious':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'national':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHolidayTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <Building2 className="h-4 w-4" />;
      case 'company':
        return <Star className="h-4 w-4" />;
      case 'religious':
        return <Heart className="h-4 w-4" />;
      case 'national':
        return <Flag className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getUpcomingHolidays = () => {
    const today = new Date();
    return holidays
      .filter(holiday => {
        const holidayDate = typeof holiday.date === 'string' ? new Date(holiday.date) : holiday.date;
        return holidayDate >= today;
      })
      .sort((a, b) => {
        const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || holiday.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && holiday.isActive) ||
                         (statusFilter === 'inactive' && !holiday.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  const upcomingHolidays = getUpcomingHolidays();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Holidays</p>
                  <p className="text-2xl font-bold text-slate-900">{holidays.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Holidays</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {holidays.filter(h => h.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Recurring</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {holidays.filter(h => h.isRecurring).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-slate-600">This Year</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {holidays.filter(h => {
                      const holidayDate = typeof h.date === 'string' ? new Date(h.date) : h.date;
                      return holidayDate.getFullYear() === new Date().getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search holidays..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="religious">Religious</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHolidays}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                {showCreateButton && (
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => {
                          resetForm();
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Holiday
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Holidays ({filteredHolidays.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Loading holidays...</span>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No holidays found</p>
              <p className="text-sm text-slate-500">Try adjusting your filters or add new holidays</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getHolidayTypeIcon(holiday.type)}
                          <div>
                            <p className="font-medium text-slate-900">{holiday.name}</p>
                            {holiday.description && (
                              <p className="text-sm text-slate-500">{holiday.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{formatDate(holiday.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getHolidayTypeColor(holiday.type)}>
                          {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={holiday.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {holiday.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={holiday.isRecurring ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {holiday.isRecurring ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ActionsDropdown
                          actions={[
                            createEditAction(() => handleEditHoliday(holiday.id)),
                            createToggleStatusAction(
                              holiday.isActive,
                              () => handleToggleHolidayStatus(holiday.id, holiday.isActive),
                              processingHolidays.has(holiday.id)
                            ),
                            createDeleteAction(
                              () => handleDeleteHoliday(holiday.id),
                              processingHolidays.has(holiday.id)
                            )
                          ]}
                          disabled={processingHolidays.has(holiday.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Holidays Preview */}
      {upcomingHolidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getHolidayTypeIcon(holiday.type)}
                    <div>
                      <p className="font-medium text-slate-900">{holiday.name}</p>
                      <p className="text-sm text-slate-500">{formatDate(holiday.date)}</p>
                    </div>
                  </div>
                  <Badge className={getHolidayTypeColor(holiday.type)}>
                    {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Holiday Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Holiday Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter holiday name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter holiday description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: 'public' | 'company' | 'religious' | 'national') => 
                setFormData(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select holiday type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                />
                <Label htmlFor="recurring">Recurring Holiday</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateHoliday}>
                Create Holiday
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Holiday Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter holiday name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter holiday description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select value={formData.type} onValueChange={(value: 'public' | 'company' | 'religious' | 'national') => 
                setFormData(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select holiday type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                  <SelectItem value="national">National</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                />
                <Label htmlFor="edit-recurring">Recurring Holiday</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateHoliday}>
                Update Holiday
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HolidaysTable;
