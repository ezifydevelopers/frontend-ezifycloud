import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { employeeAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  FileText,
  CalendarDays,
  RefreshCw,
  ArrowLeft,
  Clock as ClockIcon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import LeaveRequestForm from '@/components/forms/LeaveRequestForm';
import { LeaveBalanceCard } from '@/components/hoc/withLeaveBalance';

const RequestLeavePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshAfterLeaveAction } = useDataRefresh();
  const [loading, setLoading] = useState(false);
  
  // Public Holidays state
  const [upcomingHolidays, setUpcomingHolidays] = useState<Record<string, unknown>[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);

  // Fetch public holidays
  const fetchUpcomingHolidays = useCallback(async () => {
    try {
      setHolidaysLoading(true);
      const response = await employeeAPI.getUpcomingHolidays(10);
      if (response.success && response.data) {
        setUpcomingHolidays(response.data as unknown as Record<string, unknown>[]);
      } else {
        setUpcomingHolidays([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming holidays:', error);
      setUpcomingHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingHolidays();
  }, [fetchUpcomingHolidays]);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (loading) {
      console.warn('⚠️ RequestLeavePage: Submission already in progress, ignoring duplicate request');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 RequestLeavePage: Submitting form data:', data);
      
      const response = await employeeAPI.createLeaveRequest(data as any);
      
      if (response.success) {
        toast({
          title: "✅ Leave Request Submitted",
          description: "Your leave request has been sent to your manager for approval.",
          duration: 6000,
        });
        
        await refreshAfterLeaveAction('create');
        navigate('/employee/leave-history');
      } else {
        const errorMessage = response.message || 'Failed to submit leave request. Please try again.';
        
        let title = "❌ Leave Request Failed";
        let description = errorMessage;
        let variant: 'default' | 'destructive' = 'destructive';
        
        if (errorMessage.includes('already have a leave request') || errorMessage.includes('overlapping')) {
          title = "⚠️ Overlapping Leave Request";
          description = `${errorMessage}\n\nYou already have a pending or approved leave request for this period. Please check your leave history or choose different dates.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Insufficient leave balance')) {
          title = "⚠️ Insufficient Leave Balance";
          description = `${errorMessage}\n\nPlease adjust your leave request to match your available balance.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Policy violation') || errorMessage.includes('Policy violations')) {
          title = "⚠️ Policy Violation";
          // Extract the specific violation message(s) after "Policy violation:" or "Policy violations:"
          const violationDetails = errorMessage.replace(/^Policy violations?:?\s*/i, '').trim();
          description = violationDetails || errorMessage;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('negative balance') || errorMessage.includes('deducted from salary')) {
          title = "💰 Salary Deduction Notice";
          description = `${errorMessage}\n\nYour request will be processed with salary deduction for excess days.`;
          variant = 'default'; // Show as warning, not error
        }
        
        toast({
          title,
          description,
          variant,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      let errorMessage = 'Failed to submit leave request. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        let title = "❌ Error";
        let description = errorMessage;
        
        let variant: 'default' | 'destructive' = 'destructive';
        
        if (errorMessage.includes('already have a leave request') || errorMessage.includes('overlapping')) {
          title = "⚠️ Overlapping Leave Request";
          description = `${errorMessage}\n\nYou already have a pending or approved leave request for this period. Please check your leave history or choose different dates.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Insufficient leave balance')) {
          title = "⚠️ Insufficient Leave Balance";
          description = `${errorMessage}\n\nPlease adjust your leave request.`;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('Policy violation') || errorMessage.includes('Policy violations')) {
          title = "⚠️ Policy Violation";
          // Extract the specific violation message(s) after "Policy violation:" or "Policy violations:"
          const violationDetails = errorMessage.replace(/^Policy violations?:?\s*/i, '').trim();
          description = violationDetails || errorMessage;
          variant = 'default'; // Show as warning, not error
        } else if (errorMessage.includes('negative balance') || errorMessage.includes('deducted from salary')) {
          title = "💰 Salary Deduction Notice";
          description = `${errorMessage}\n\nYour request will be processed with salary deduction for excess days.`;
          variant = 'default'; // Show as warning, not error
        }
        
        toast({
          title,
          description,
          variant,
          duration: 8000,
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ width: '100%', maxWidth: '1088px', boxSizing: 'border-box' }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Request Leave
                      </h1>
                    </div>
                  </div>
                  <p className="text-slate-600 text-base lg:text-lg">
                    Submit a new leave request. Your manager will be notified for approval.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <ClockIcon className="h-4 w-4" />
                      <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/employee/dashboard')}
                  className="bg-white/50 border-white/20 hover:bg-white/80"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
            {/* Left Column - Leave Balance & Public Holidays */}
            <div className="lg:col-span-1 flex flex-col space-y-6">
              <LeaveBalanceCard />
              
              {/* Public Holidays Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <CalendarDays className="h-5 w-5 text-white" />
                    </div>
                    Public Holidays
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {holidaysLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading holidays...</p>
                    </div>
                  ) : upcomingHolidays.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {upcomingHolidays.map((holiday: Record<string, unknown>) => (
                        <div 
                          key={holiday.id as string || Math.random().toString()} 
                          className="p-3 rounded-lg border border-slate-200/50 bg-gradient-to-r from-slate-50 to-emerald-50/30 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">{holiday.name as string || 'Holiday'}</p>
                              <p className="text-xs text-slate-600 mt-1">
                                {holiday.type as string || 'Public'} Holiday
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-semibold text-slate-800 text-sm">
                                {new Date(holiday.date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(holiday.date as string).toLocaleDateString('en-US', { weekday: 'short' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CalendarDays className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No upcoming holidays</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Leave Request Form */}
            <div className="lg:col-span-2 flex flex-col">
              <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl h-full flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    Submit Leave Request
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Fill out the form below to submit your leave request. Your manager will be notified for approval.
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-auto">
                  <LeaveRequestForm 
                    onSubmit={handleFormSubmit}
                    className="flex-1"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestLeavePage;

