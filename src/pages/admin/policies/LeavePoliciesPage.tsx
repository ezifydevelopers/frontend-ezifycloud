import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Star,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface LeavePolicy {
  id: string;
  name: string;
  type: 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Paternity' | 'Emergency';
  daysPerYear: number;
  carryForward: boolean;
  maxCarryForward: number;
  requiresApproval: boolean;
  advanceNotice: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const LeavePoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Mock data
  const mockPolicies: LeavePolicy[] = [
    {
      id: '1',
      name: 'Annual Leave Policy',
      type: 'Annual',
      daysPerYear: 25,
      carryForward: true,
      maxCarryForward: 5,
      requiresApproval: true,
      advanceNotice: 7,
      description: 'Standard annual leave policy for all employees',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Sick Leave Policy',
      type: 'Sick',
      daysPerYear: 10,
      carryForward: false,
      maxCarryForward: 0,
      requiresApproval: false,
      advanceNotice: 0,
      description: 'Sick leave policy for health-related absences',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      name: 'Casual Leave Policy',
      type: 'Casual',
      daysPerYear: 8,
      carryForward: false,
      maxCarryForward: 0,
      requiresApproval: true,
      advanceNotice: 2,
      description: 'Casual leave for personal matters',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '4',
      name: 'Maternity Leave Policy',
      type: 'Maternity',
      daysPerYear: 90,
      carryForward: false,
      maxCarryForward: 0,
      requiresApproval: true,
      advanceNotice: 30,
      description: 'Maternity leave policy for new mothers',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPolicies(mockPolicies);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch leave policies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async (policyData: Partial<LeavePolicy>) => {
    try {
      if (editingPolicy) {
        // Update existing policy
        setPolicies(prev => prev.map(p => 
          p.id === editingPolicy.id 
            ? { ...p, ...policyData, updatedAt: new Date().toISOString() }
            : p
        ));
        toast({
          title: 'Policy updated',
          description: 'Leave policy has been updated successfully',
        });
      } else {
        // Create new policy
        const newPolicy: LeavePolicy = {
          id: Date.now().toString(),
          ...policyData as LeavePolicy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPolicies(prev => [...prev, newPolicy]);
        toast({
          title: 'Policy created',
          description: 'New leave policy has been created successfully',
        });
      }
      setShowForm(false);
      setEditingPolicy(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save leave policy',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    try {
      setPolicies(prev => prev.filter(p => p.id !== policyId));
      toast({
        title: 'Policy deleted',
        description: 'Leave policy has been deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete leave policy',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (policyId: string) => {
    try {
      setPolicies(prev => prev.map(p => 
        p.id === policyId 
          ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() }
          : p
      ));
      toast({
        title: 'Status updated',
        description: 'Policy status has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update policy status',
        variant: 'destructive',
      });
    }
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || policy.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Annual':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Sick':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Casual':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Maternity':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Paternity':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  // Mock statistics
  const stats = [
    {
      title: 'Total Policies',
      value: policies.length,
      description: 'Configured policies',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      title: 'Active Policies',
      value: policies.filter(p => p.isActive).length,
      description: 'Currently in use',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: 'Policy Types',
      value: new Set(policies.map(p => p.type)).size,
      description: 'Different categories',
      icon: Shield,
      color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    },
    {
      title: 'Auto-Approval',
      value: policies.filter(p => !p.requiresApproval).length,
      description: 'No approval needed',
      icon: Settings,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Leave Policies
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Configure and manage leave policies for your organization.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">System Online</span>
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

      {/* Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200/50 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200/50 rounded-md bg-white/50 focus:border-blue-300 focus:ring-blue-200"
              >
                <option value="all">All Types</option>
                <option value="Annual">Annual</option>
                <option value="Sick">Sick</option>
                <option value="Casual">Casual</option>
                <option value="Maternity">Maternity</option>
                <option value="Paternity">Paternity</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Policy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xl">Leave Policies ({filteredPolicies.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50">
                    <TableHead className="font-semibold">Policy Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Days/Year</TableHead>
                    <TableHead className="font-semibold">Carry Forward</TableHead>
                    <TableHead className="font-semibold">Approval Required</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy, index) => (
                    <TableRow 
                      key={policy.id} 
                      className="group hover:bg-slate-50/50 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-900">{policy.name}</p>
                          <p className="text-sm text-slate-500">{policy.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(policy.type)}>
                          {policy.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">{policy.daysPerYear}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {policy.carryForward ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-slate-600">
                                {policy.maxCarryForward} days max
                              </span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-slate-600">No</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {policy.requiresApproval ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-slate-600">
                                {policy.advanceNotice} days notice
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-slate-600">Auto-approved</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={policy.isActive}
                            onCheckedChange={() => handleToggleStatus(policy.id)}
                          />
                          <Badge className={getStatusColor(policy.isActive)}>
                            {policy.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingPolicy(policy);
                              setShowForm(true);
                            }}
                            className="hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePolicy(policy.id)}
                            className="hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingPolicy ? 'Edit Policy' : 'Create New Policy'}
            </DialogTitle>
            <DialogDescription>
              {editingPolicy ? 'Update the leave policy details' : 'Configure a new leave policy for your organization'}
            </DialogDescription>
          </DialogHeader>
          <PolicyForm
            policy={editingPolicy}
            onSave={handleSavePolicy}
            onCancel={() => {
              setShowForm(false);
              setEditingPolicy(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Policy Form Component
const PolicyForm: React.FC<{
  policy: LeavePolicy | null;
  onSave: (data: Partial<LeavePolicy>) => void;
  onCancel: () => void;
}> = ({ policy, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: policy?.name || '',
    type: policy?.type || 'Annual',
    daysPerYear: policy?.daysPerYear || 0,
    carryForward: policy?.carryForward || false,
    maxCarryForward: policy?.maxCarryForward || 0,
    requiresApproval: policy?.requiresApproval || true,
    advanceNotice: policy?.advanceNotice || 0,
    description: policy?.description || '',
    isActive: policy?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Policy Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter policy name"
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Leave Type</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-blue-300 focus:ring-blue-200"
            required
          >
            <option value="Annual">Annual Leave</option>
            <option value="Sick">Sick Leave</option>
            <option value="Casual">Casual Leave</option>
            <option value="Maternity">Maternity Leave</option>
            <option value="Paternity">Paternity Leave</option>
            <option value="Emergency">Emergency Leave</option>
          </select>
        </div>
        <div>
          <Label htmlFor="daysPerYear">Days Per Year</Label>
          <Input
            id="daysPerYear"
            type="number"
            value={formData.daysPerYear}
            onChange={(e) => setFormData(prev => ({ ...prev, daysPerYear: parseInt(e.target.value) }))}
            placeholder="Enter days per year"
            required
          />
        </div>
        <div>
          <Label htmlFor="advanceNotice">Advance Notice (Days)</Label>
          <Input
            id="advanceNotice"
            type="number"
            value={formData.advanceNotice}
            onChange={(e) => setFormData(prev => ({ ...prev, advanceNotice: parseInt(e.target.value) }))}
            placeholder="Enter advance notice days"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="carryForward"
            checked={formData.carryForward}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, carryForward: checked }))}
          />
          <Label htmlFor="carryForward">Allow Carry Forward</Label>
        </div>

        {formData.carryForward && (
          <div>
            <Label htmlFor="maxCarryForward">Max Carry Forward Days</Label>
            <Input
              id="maxCarryForward"
              type="number"
              value={formData.maxCarryForward}
              onChange={(e) => setFormData(prev => ({ ...prev, maxCarryForward: parseInt(e.target.value) }))}
              placeholder="Enter max carry forward days"
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="requiresApproval"
            checked={formData.requiresApproval}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
          />
          <Label htmlFor="requiresApproval">Requires Manager Approval</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Policy is Active</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter policy description"
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Save className="mr-2 h-4 w-4" />
          {policy ? 'Update Policy' : 'Create Policy'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default LeavePoliciesPage;