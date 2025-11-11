import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EstimatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [estimates] = useState<any[]>([]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Accepted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Draft</Badge>;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
            <p className="text-gray-600 mt-1">Manage estimates and quotes</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Estimate
          </Button>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search estimates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" className="border-gray-300">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="border-gray-300">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Estimates</CardTitle>
            <CardDescription>
              {estimates.length === 0 
                ? 'No estimates found. Create your first estimate to get started.'
                : `${estimates.length} estimate${estimates.length === 1 ? '' : 's'} found`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estimates.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No estimates yet</p>
                <p className="text-sm text-gray-500 mb-6">Create your first estimate to get started</p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estimate #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((estimate) => (
                    <TableRow key={estimate.id}>
                      <TableCell className="font-medium">{estimate.estimateNumber || 'N/A'}</TableCell>
                      <TableCell>{estimate.clientName || 'N/A'}</TableCell>
                      <TableCell>{estimate.date || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">${estimate.amount || '0.00'}</TableCell>
                      <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                      <TableCell>{estimate.expiryDate || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Convert to Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EstimatesPage;

