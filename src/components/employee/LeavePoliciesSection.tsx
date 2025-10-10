import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Shield,
  Eye,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { employeeAPI } from '@/lib/api';
import { LeavePolicy, LeaveType } from '@/types/leave';

interface LeavePoliciesSectionProps {
  className?: string;
}

const LeavePoliciesSection: React.FC<LeavePoliciesSectionProps> = ({ className }) => {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPolicies: 0,
    activePolicies: 0,
    inactivePolicies: 0,
    byLeaveType: {} as Record<string, number>
  });

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getLeavePolicies({
        search: searchTerm,
        status: 'active', // Only show active policies for employees
        limit: 50
      });

      if (response.success) {
        const policiesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setPolicies(policiesData);
      }
    } catch (error) {
      console.error('Error fetching leave policies:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPolicies();
    fetchStats();
  }, [fetchPolicies]);

  const fetchStats = async () => {
    try {
      const response = await employeeAPI.getLeavePolicyStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching leave policy stats:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPolicies();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchPolicies]);

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annual: 'bg-blue-100 text-blue-800 border-blue-200',
      sick: 'bg-red-100 text-red-800 border-red-200',
      casual: 'bg-purple-100 text-purple-800 border-purple-200',
      emergency: 'bg-orange-100 text-orange-800 border-orange-200',
      maternity: 'bg-pink-100 text-pink-800 border-pink-200',
      paternity: 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const toggleExpanded = (policyId: string) => {
    setExpandedPolicy(expandedPolicy === policyId ? null : policyId);
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Leave Policies</h3>
              <p className="text-sm text-blue-700 mt-1">
                View the available leave policies and their details. These policies determine your leave entitlements and requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.activePolicies}</p>
                <p className="text-sm text-slate-500">Available Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{Object.keys(stats.byLeaveType).length}</p>
                <p className="text-sm text-slate-500">Policy Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalPolicies}</p>
                <p className="text-sm text-slate-500">Total Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200/50"
                />
              </div>
            </div>
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
            <span className="text-xl">Available Leave Policies ({filteredPolicies.length})</span>
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
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.length > 0 ? (
                    filteredPolicies.map((policy) => (
                      <React.Fragment key={policy.id}>
                        <TableRow className="group hover:bg-slate-50/50 transition-colors duration-200">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-slate-900">{policy.name}</p>
                              <p className="text-sm text-slate-500">{policy.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getLeaveTypeColor(policy.leaveType)}>
                              {policy.leaveType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">{policy.maxDaysPerYear}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {policy.carryForwardDays > 0 ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">{policy.carryForwardDays} days max</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-sm">No</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">
                                {policy.requiresApproval ? 'Manual approval' : 'Auto approval'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(policy.id)}
                                className="h-8 w-8 p-0"
                              >
                                {expandedPolicy === policy.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedPolicy === policy.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-slate-50/50 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-2">Policy Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Max Days per Request:</span>
                                      <span className="font-medium">{policy.maxDaysPerRequest}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Carry Forward Expiry:</span>
                                      <span className="font-medium">{policy.carryForwardExpiry} months</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Requires Documentation:</span>
                                      <span className="font-medium">{policy.requiresDocumentation ? 'Yes' : 'No'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-2">Applicable To</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="text-slate-500">Roles:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {policy.applicableRoles.length > 0 ? (
                                          policy.applicableRoles.map((role, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {role}
                                            </Badge>
                                          ))
                                        ) : (
                                          <span className="text-slate-400">All roles</span>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Departments:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {policy.applicableDepartments.length > 0 ? (
                                          policy.applicableDepartments.map((dept, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {dept}
                                            </Badge>
                                          ))
                                        ) : (
                                          <span className="text-slate-400">All departments</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="p-4 bg-slate-100 rounded-full">
                            <BookOpen className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">No leave policies found</h3>
                            <p className="text-slate-500 mt-1">
                              {policies.length === 0 
                                ? "No leave policies have been configured yet." 
                                : "No policies match your current filters."}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeavePoliciesSection;
