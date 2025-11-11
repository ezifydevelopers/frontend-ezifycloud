import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { reportAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ReportResult } from '@/types/report';
import { format } from 'date-fns';

interface ReportViewerProps {
  reportId: string;
  reportName: string;
  onExport?: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  reportId,
  reportName,
  onExport,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportResult | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.generateReport({
        type: 'custom', // Will be determined by report config
        config: {},
      });
      if (response.success && response.data) {
        setReportData(response.data as ReportResult);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/export/${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Report exported successfully',
      });
      onExport?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const isGroupHeader = (row: Record<string, unknown>) => {
    return (row as any)._isGroupHeader === true;
  };

  const isGroupSummary = (row: Record<string, unknown>) => {
    return (row as any)._isGroupSummary === true;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{reportName}</CardTitle>
            {reportData && (
              <p className="text-sm text-muted-foreground mt-1">
                Generated: {format(new Date(reportData.metadata.generatedAt), 'PPpp')} •{' '}
                {reportData.metadata.totalRows} rows
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!reportData && (
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            )}
            {reportData && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  <File className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!reportData ? (
          <div className="text-center py-12 text-muted-foreground">
            Click "Generate Report" to view the report data
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {reportData.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(reportData.summary.totals || {}).map(([key, value]) => (
                  <div key={key} className="p-3 border rounded">
                    <div className="text-sm text-muted-foreground">{key}</div>
                    <div className="text-lg font-semibold">{value}</div>
                  </div>
                ))}
                {Object.entries(reportData.summary.counts || {}).map(([key, value]) => (
                  <div key={key} className="p-3 border rounded">
                    <div className="text-sm text-muted-foreground">{key}</div>
                    <div className="text-lg font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {reportData.columns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={reportData.columns.length} className="text-center text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.rows.map((row, index) => {
                      if (isGroupHeader(row)) {
                        return (
                          <TableRow key={index} className="bg-muted/50">
                            <TableCell colSpan={reportData.columns.length} className="font-semibold">
                              {String(row[reportData.columns[0]])}
                            </TableCell>
                          </TableRow>
                        );
                      }
                      if (isGroupSummary(row)) {
                        return (
                          <TableRow key={index} className="bg-muted/30">
                            {reportData.columns.map((col) => (
                              <TableCell key={col} className="font-medium">
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      }
                      return (
                        <TableRow key={index}>
                          {reportData.columns.map((col) => (
                            <TableCell key={col}>
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
