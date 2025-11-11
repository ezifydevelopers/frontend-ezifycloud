import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

interface SummaryTableWidgetProps {
  title: string;
  columns: Array<{ key: string; label: string; sortable?: boolean }>;
  data: Array<Record<string, unknown>>;
  onRowClick?: (row: Record<string, unknown>) => void;
  className?: string;
  maxRows?: number;
}

export const SummaryTableWidget: React.FC<SummaryTableWidgetProps> = ({
  title,
  columns,
  data,
  onRowClick,
  className,
  maxRows = 10,
}) => {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data.slice(0, maxRows);

    return [...data]
      .sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      })
      .slice(0, maxRows);
  }, [data, sortColumn, sortDirection, maxRows]);

  const formatValue = (value: unknown): string => {
    if (value == null) return '-';
    if (value instanceof Date) return format(value, 'PP');
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-xl ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 -ml-2"
                          onClick={() => handleSort(column.key)}
                        >
                          <span className="mr-2">{column.label}</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      ) : (
                        column.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.key === 'status' && typeof row[column.key] === 'string' ? (
                          <Badge variant="outline">{formatValue(row[column.key])}</Badge>
                        ) : (
                          formatValue(row[column.key])
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

