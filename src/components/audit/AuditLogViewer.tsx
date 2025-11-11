import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, DownloadIcon, FilterIcon, SearchIcon } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  resourceType?: string;
  resourceId?: string;
  fieldChanges?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  statusCode?: number;
  createdAt: string;
}

interface AuditLogViewerProps {
  resourceType?: string;
  resourceId?: string;
  targetType?: string;
  targetId?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  resourceType,
  resourceId,
  targetType,
  targetId,
}) => {
  const [filters, setFilters] = useState({
    action: '',
    targetType: targetType || '',
    userId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auditLogs', filters, resourceType, resourceId, targetType, targetId],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      };

      if (filters.action) params.action = filters.action;
      if (filters.targetType) params.targetType = filters.targetType;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (resourceType) params.resourceType = resourceType;
      if (resourceId) params.resourceId = resourceId;
      if (targetType) params.targetType = targetType;
      if (targetId) params.targetId = targetId;

      const response = resourceType && resourceId
        ? await auditAPI.getResourceAuditLogs(resourceType, resourceId, { page: filters.page, limit: filters.limit })
        : targetType && targetId
        ? await auditAPI.getTargetAuditLogs(targetType, targetId, { page: filters.page, limit: filters.limit })
        : await auditAPI.getAuditLogs(params);

      return response.data;
    },
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params: Record<string, string> = { format };
      if (filters.action) params.action = filters.action;
      if (filters.targetType) params.targetType = filters.targetType;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (resourceType) params.resourceType = resourceType;
      if (resourceId) params.resourceId = resourceId;
      if (targetType) params.targetType = targetType;
      if (targetId) params.targetId = targetId;

      const blob = await auditAPI.exportAuditLogs(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'view':
        return 'bg-gray-100 text-gray-800';
      case 'export':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const logs = (data?.logs as AuditLog[]) || [];
  const totalPages = data?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Track all user actions and changes in the system
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select
            value={filters.action}
            onValueChange={(value) => setFilters({ ...filters, action: value, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="text"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value, page: 1 })}
          />

          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
          />

          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8">Loading audit logs...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">Error loading audit logs</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No audit logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.targetType && (
                          <div className="text-sm">
                            <div className="font-medium">{log.targetType}</div>
                            {log.targetId && (
                              <div className="text-xs text-gray-500">{log.targetId.slice(0, 8)}...</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.resourceType && (
                          <div className="text-sm">
                            <div className="font-medium">{log.resourceType}</div>
                            {log.resourceId && (
                              <div className="text-xs text-gray-500">{log.resourceId.slice(0, 8)}...</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        {log.fieldChanges && log.fieldChanges.length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium mb-1">Field Changes:</div>
                            {log.fieldChanges.slice(0, 2).map((change, idx) => (
                              <div key={idx} className="text-gray-600">
                                {change.field}: {String(change.oldValue)} → {String(change.newValue)}
                              </div>
                            ))}
                            {log.fieldChanges.length > 2 && (
                              <div className="text-gray-400">+{log.fieldChanges.length - 2} more</div>
                            )}
                          </div>
                        )}
                        {log.requestPath && (
                          <div className="text-xs text-gray-500 mt-1">
                            {log.requestMethod} {log.requestPath}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {filters.page} of {totalPages} ({data?.total || 0} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

