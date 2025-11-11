// Enhanced Approval Queue Component - For board-level approval queue

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { approvalAPI } from '@/lib/api';
import { ApprovalLevel, ApprovalStatus } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ArrowUpDown,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Approval {
  id: string;
  itemId: string;
  level: ApprovalLevel;
  status: ApprovalStatus;
  comments?: string;
  approverId?: string;
  approvedAt?: string;
  createdAt: string;
  item?: {
    id: string;
    name: string;
    boardId?: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApprovalQueueEnhancedProps {
  boardId?: string;
  workspaceId?: string;
}

const LEVEL_LABELS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'Level 1 - Sir Salman',
  LEVEL_2: 'Level 2 - Radhika',
  LEVEL_3: 'Level 3 - Finance Team',
};

const LEVEL_COLORS: Record<ApprovalLevel, string> = {
  LEVEL_1: 'bg-blue-100 text-blue-800 border-blue-200',
  LEVEL_2: 'bg-purple-100 text-purple-800 border-purple-200',
  LEVEL_3: 'bg-green-100 text-green-800 border-green-200',
};

type SortField = 'createdAt' | 'level' | 'itemName';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'level' | 'none';

export const ApprovalQueueEnhanced: React.FC<ApprovalQueueEnhancedProps> = ({
  boardId,
  workspaceId,
}) => {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<ApprovalLevel | 'all'>('all');
  const [filterApprover, setFilterApprover] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [groupBy, setGroupBy] = useState<GroupBy>('level');

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getMyPendingApprovals();
      if (response.success && response.data) {
        let approvalsData = (response.data as Approval[]) || [];
        
        // Filter by board if specified
        if (boardId) {
          approvalsData = approvalsData.filter(
            a => a.item?.boardId === boardId
          );
        }

        setApprovals(approvalsData);
      } else {
        setApprovals([]);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approvals',
        variant: 'destructive',
      });
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, toast]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Filter approvals
  const filteredApprovals = approvals.filter((approval) => {
    const matchesLevel = filterLevel === 'all' || approval.level === filterLevel;
    const matchesApprover = filterApprover === 'all' || approval.approverId === filterApprover;
    const matchesSearch =
      !searchTerm ||
      approval.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesLevel && matchesApprover && matchesSearch;
  });

  // Sort approvals
  const sortedApprovals = [...filteredApprovals].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'level':
        const levelOrder = { LEVEL_1: 1, LEVEL_2: 2, LEVEL_3: 3 };
        comparison = levelOrder[a.level] - levelOrder[b.level];
        break;
      case 'itemName':
        comparison = (a.item?.name || '').localeCompare(b.item?.name || '');
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Group approvals
  const groupedApprovals = groupBy === 'level'
    ? sortedApprovals.reduce((acc, approval) => {
        if (!acc[approval.level]) {
          acc[approval.level] = [];
        }
        acc[approval.level].push(approval);
        return acc;
      }, {} as Record<ApprovalLevel, Approval[]>)
    : { all: sortedApprovals } as Record<string, Approval[]>;

  // Calculate deadline (assuming 3 days from creation)
  const getDeadline = (createdAt: string): Date => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 3);
    return date;
  };

  const isOverdue = (createdAt: string): boolean => {
    const deadline = getDeadline(createdAt);
    return new Date() > deadline;
  };

  const getApprovers = (): Array<{ id: string; name: string }> => {
    const approversMap = new Map<string, string>();
    approvals.forEach(a => {
      if (a.approver && a.approver.id) {
        approversMap.set(a.approver.id, a.approver.name);
      }
    });
    return Array.from(approversMap.entries()).map(([id, name]) => ({ id, name }));
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUpDown className="h-3 w-3 ml-1 rotate-180" />
      : <ArrowUpDown className="h-3 w-3 ml-1" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Approval Queue ({filteredApprovals.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-48"
              />
            </div>
            <Select value={filterLevel} onValueChange={(value) => setFilterLevel(value as ApprovalLevel | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="LEVEL_1">Level 1</SelectItem>
                <SelectItem value="LEVEL_2">Level 2</SelectItem>
                <SelectItem value="LEVEL_3">Level 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterApprover} onValueChange={(value) => setFilterApprover(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Approver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approvers</SelectItem>
                {getApprovers().map(approver => (
                  <SelectItem key={approver.id} value={approver.id}>
                    {approver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="level">Group by Level</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchApprovals}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending approvals found</p>
          </div>
        ) : groupBy === 'level' ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({filteredApprovals.length})</TabsTrigger>
              <TabsTrigger value="LEVEL_1">
                Level 1 ({groupedApprovals['LEVEL_1']?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="LEVEL_2">
                Level 2 ({groupedApprovals['LEVEL_2']?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="LEVEL_3">
                Level 3 ({groupedApprovals['LEVEL_3']?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ApprovalTable
                approvals={sortedApprovals}
                onSort={toggleSort}
                sortField={sortField}
                sortDirection={sortDirection}
                getSortIcon={getSortIcon}
                getDeadline={getDeadline}
                isOverdue={isOverdue}
              />
            </TabsContent>

            {(['LEVEL_1', 'LEVEL_2', 'LEVEL_3'] as ApprovalLevel[]).map((level) => (
              <TabsContent key={level} value={level} className="mt-4">
                <ApprovalTable
                  approvals={groupedApprovals[level] || []}
                  onSort={toggleSort}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  getSortIcon={getSortIcon}
                  getDeadline={getDeadline}
                  isOverdue={isOverdue}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <ApprovalTable
            approvals={sortedApprovals}
            onSort={toggleSort}
            sortField={sortField}
            sortDirection={sortDirection}
            getSortIcon={getSortIcon}
            getDeadline={getDeadline}
            isOverdue={isOverdue}
          />
        )}
      </CardContent>
    </Card>
  );
};

interface ApprovalTableProps {
  approvals: Approval[];
  onSort: (field: SortField) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  getSortIcon: (field: SortField) => React.ReactNode;
  getDeadline: (createdAt: string) => Date;
  isOverdue: (createdAt: string) => boolean;
}

const ApprovalTable: React.FC<ApprovalTableProps> = ({
  approvals,
  onSort,
  sortField,
  sortDirection,
  getSortIcon,
  getDeadline,
  isOverdue,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-semibold"
                onClick={() => onSort('itemName')}
              >
                Item Name
                {getSortIcon('itemName')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-semibold"
                onClick={() => onSort('level')}
              >
                Level
                {getSortIcon('level')}
              </Button>
            </TableHead>
            <TableHead>Approver</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 font-semibold"
                onClick={() => onSort('createdAt')}
              >
                Submitted
                {getSortIcon('createdAt')}
              </Button>
            </TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals.map((approval) => {
            const deadline = getDeadline(approval.createdAt);
            const overdue = isOverdue(approval.createdAt);
            
            return (
              <TableRow
                key={approval.id}
                className={overdue ? 'bg-red-50 border-l-4 border-red-500' : ''}
              >
                <TableCell className="font-medium">
                  {approval.item?.name || 'Unknown Item'}
                </TableCell>
                <TableCell>
                  <Badge className={LEVEL_COLORS[approval.level]}>
                    {LEVEL_LABELS[approval.level]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {approval.approver?.name || (
                    <span className="text-muted-foreground text-sm">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(approval.createdAt), { addSuffix: true })}
                  <br />
                  <span className="text-xs">
                    {format(new Date(approval.createdAt), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${overdue ? 'text-red-600' : 'text-muted-foreground'}`} />
                    <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                      {format(deadline, 'MMM d, yyyy')}
                    </span>
                    {overdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      approval.status === 'approved'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : approval.status === 'rejected'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {approval.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {approval.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

