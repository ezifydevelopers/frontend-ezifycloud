import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';

const AttendancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
              <Calendar className="h-16 w-16 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Attendance Management
              </h1>
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <p className="text-xl font-medium">Coming Soon</p>
              </div>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                We're developing a powerful attendance management system for you. 
                This feature will enable you to track employee attendance, manage check-ins 
                and check-outs, and generate comprehensive attendance reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
