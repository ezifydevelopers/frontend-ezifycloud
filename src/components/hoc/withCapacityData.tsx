import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { managerAPI, adminAPI, employeeAPI } from '@/lib/api';

// Centralized capacity data interface
export interface CapacityData {
  // Overall Statistics
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  workingRemotely: number;
  
  // Attendance Metrics
  attendanceRate: number;
  capacityUtilization: number;
  officeOccupancy: number;
  
  // Department Breakdown
  departments: Array<{
    name: string;
    totalEmployees: number;
    presentToday: number;
    onLeaveToday: number;
    attendanceRate: number;
  }>;
  
  // Employee Details
  employees: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    position: string;
    status: 'present' | 'absent' | 'on-leave' | 'remote' | 'offline';
    lastActive: string;
    isAvailable: boolean;
    avatar?: string;
  }>;
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface WithCapacityDataProps {
  capacityData: CapacityData;
  refreshCapacityData: () => Promise<void>;
  isRefreshing: boolean;
}

export interface WithCapacityDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
  cacheTimeout?: number; // in milliseconds
  includeEmployeeDetails?: boolean;
}

// Cache for capacity data
let capacityDataCache: {
  data: CapacityData | null;
  timestamp: number;
  userRole: string | null;
} = {
  data: null,
  timestamp: 0,
  userRole: null
};

export function withCapacityData<P extends object>(
  WrappedComponent: React.ComponentType<P & WithCapacityDataProps>,
  options: WithCapacityDataOptions = {}
) {
  const {
    autoFetch = true,
    refreshInterval = 30000, // 30 seconds
    cacheTimeout = 60000, // 1 minute
    includeEmployeeDetails = true
  } = options;

  return function WithCapacityDataComponent(props: P) {
    const { user } = useAuth();
    const [capacityData, setCapacityData] = useState<CapacityData>({
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      onLeaveToday: 0,
      workingRemotely: 0,
      attendanceRate: 0,
      capacityUtilization: 0,
      officeOccupancy: 0,
      departments: [],
      employees: [],
      isLoading: true,
      error: null,
      lastUpdated: null
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchCapacityData = useCallback(async (forceRefresh = false) => {
      if (!user) return;

      const now = Date.now();
      const cacheKey = `${user.role}-${user.id}`;
      
      // Check cache validity
      if (!forceRefresh && 
          capacityDataCache.data && 
          capacityDataCache.userRole === user.role &&
          (now - capacityDataCache.timestamp) < cacheTimeout) {
        console.log('✅ withCapacityData: Using cached data');
        setCapacityData(capacityDataCache.data);
        return;
      }

      try {
        setIsRefreshing(true);
        setCapacityData(prev => ({ ...prev, isLoading: true, error: null }));
        
        console.log('🔍 withCapacityData: Fetching capacity data for user:', user.role);
        
        // Fetch data based on user role
        let employeesResponse, leavesResponse, departmentsResponse;
        
        switch (user.role) {
          case 'manager':
            [employeesResponse, leavesResponse, departmentsResponse] = await Promise.all([
              managerAPI.getTeamMembers({ limit: 100 }),
              managerAPI.getLeaveRequests({ status: 'approved', limit: 100 }),
              managerAPI.getTeamDepartments().catch(() => ({ success: false, data: [] }))
            ]);
            break;
            
          case 'admin':
            [employeesResponse, leavesResponse] = await Promise.all([
              adminAPI.getEmployees({ limit: 100 }),
              adminAPI.getLeaveRequests({ limit: 100 })
            ]);
            departmentsResponse = { success: true, data: [] }; // Will derive from employees
            break;
            
          case 'employee':
            // Employees don't have capacity data access
            setCapacityData(prev => ({
              ...prev,
              isLoading: false,
              error: 'Capacity data not available for employees'
            }));
            return;
            
          default:
            throw new Error('Invalid user role');
        }

        console.log('📊 withCapacityData: API responses received');
        console.log('👥 Employees response:', employeesResponse);
        console.log('📅 Leaves response:', leavesResponse);
        console.log('🏢 Departments response:', departmentsResponse);

        // Process employees data
        let totalEmployees = 0;
        let presentToday = 0;
        let absentToday = 0; // Not used anymore - everyone not on leave is "present"
        let onLeaveToday = 0;
        let workingRemotely = 0;
        const employees: Array<{
          id: string;
          name: string;
          email: string;
          department: string;
          position: string;
          status: 'present' | 'absent' | 'on-leave' | 'remote' | 'offline';
          lastActive: string;
          isAvailable: boolean;
          avatar?: string;
        }> = [];

        if (employeesResponse.success && employeesResponse.data) {
          const members = Array.isArray(employeesResponse.data) ? employeesResponse.data : employeesResponse.data.data || [];
          totalEmployees = members.length;
          
          // Get current date for leave checking (normalize to start of day)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Process current leave requests to find who is on leave today
          const currentLeaves: Record<string, boolean> = {};
          if (leavesResponse.success && leavesResponse.data) {
            const leaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : leavesResponse.data.data || [];
            leaves.forEach((leave: Record<string, unknown>) => {
              // Only process approved leave requests
              if (leave.status !== 'approved') return;
              
              const startDate = new Date(String(leave.startDate || leave.start_date || ''));
              const endDate = new Date(String(leave.endDate || leave.end_date || ''));
              const userId = String(leave.userId || leave.employeeId || leave.employee_id || '');
              
              // Normalize dates to start of day for accurate comparison
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);
              
              // Check if today falls within the leave period (inclusive)
              if (startDate <= today && today <= endDate) {
                currentLeaves[userId] = true;
              }
            });
          }
          
          // Process each employee
          // Logic: If employee is NOT on leave, they are considered "present"
          // Only employees with approved leave for today show as "on-leave"
          members.forEach((member: Record<string, unknown>) => {
            const memberId = String(member.id || '');
            const isOnLeaveToday = currentLeaves[memberId] || false;
            const lastActive = member.lastLogin || member.updatedAt || new Date().toISOString();
            
            let status: 'present' | 'absent' | 'on-leave' | 'remote' | 'offline' = 'present';
            
            if (isOnLeaveToday) {
              // Employee has approved leave for today
              status = 'on-leave';
              onLeaveToday++;
            } else {
              // Employee is NOT on leave, so they are present
              status = 'present';
              presentToday++;
            }
            
            if (includeEmployeeDetails) {
              employees.push({
                id: memberId,
                name: String(member.name || member.fullName || 'Unknown'),
                email: String(member.email || ''),
                department: String(member.department || ''),
                position: String(member.position || member.jobTitle || ''),
                status,
                lastActive: String(lastActive),
                isAvailable: status === 'present', // Available if present (not on leave)
                avatar: String(member.avatar || '')
              });
            }
          });
        }

        // Process departments data
        const departments: Array<{
          name: string;
          totalEmployees: number;
          presentToday: number;
          onLeaveToday: number;
          attendanceRate: number;
        }> = [];

        if (departmentsResponse.success && departmentsResponse.data) {
          const deptData = Array.isArray(departmentsResponse.data) ? departmentsResponse.data : departmentsResponse.data.data || [];
          
          // Group employees by department
          const deptStats: Record<string, {
            total: number;
            present: number;
            onLeave: number;
          }> = {};
          
          employees.forEach(emp => {
            if (!deptStats[emp.department]) {
              deptStats[emp.department] = { total: 0, present: 0, onLeave: 0 };
            }
            deptStats[emp.department].total++;
            if (emp.status === 'present') deptStats[emp.department].present++;
            if (emp.status === 'on-leave') deptStats[emp.department].onLeave++;
          });
          
          // Create department breakdown
          Object.entries(deptStats).forEach(([deptName, stats]) => {
            departments.push({
              name: deptName,
              totalEmployees: stats.total,
              presentToday: stats.present,
              onLeaveToday: stats.onLeave,
              attendanceRate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
            });
          });
        }

        // Calculate overall metrics
        const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
        const capacityUtilization = attendanceRate; // Same as attendance rate for now
        const officeOccupancy = totalEmployees > 0 ? Math.round(((presentToday + workingRemotely) / totalEmployees) * 100) : 0;

        const processedData: CapacityData = {
          totalEmployees,
          presentToday,
          absentToday,
          onLeaveToday,
          workingRemotely,
          attendanceRate,
          capacityUtilization,
          officeOccupancy,
          departments,
          employees: includeEmployeeDetails ? employees : [],
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        };

        // Update cache
        capacityDataCache = {
          data: processedData,
          timestamp: now,
          userRole: user.role
        };

        setCapacityData(processedData);
        console.log('✅ withCapacityData: Capacity data processed and cached:', processedData);

      } catch (error) {
        console.error('❌ withCapacityData: Error fetching capacity data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch capacity data';
        setCapacityData(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
      } finally {
        setIsRefreshing(false);
      }
    }, [user, cacheTimeout, includeEmployeeDetails]);

    const refreshCapacityData = useCallback(async () => {
      await fetchCapacityData(true);
    }, [fetchCapacityData]);

    // Auto-fetch on mount and when user changes
    useEffect(() => {
      if (autoFetch && user) {
        fetchCapacityData();
      }
    }, [autoFetch, user, fetchCapacityData]);

    // Set up auto-refresh interval
    useEffect(() => {
      if (!autoFetch || !user) return;

      const interval = setInterval(() => {
        console.log('🔄 withCapacityData: Auto-refreshing capacity data...');
        fetchCapacityData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }, [autoFetch, user, fetchCapacityData, refreshInterval]);

    // Listen for global refresh triggers
    useEffect(() => {
      const handleGlobalRefresh = () => {
        console.log('🔄 withCapacityData: Received global refresh signal');
        fetchCapacityData(true);
      };

      // Listen for storage events (cross-tab communication)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'global-refresh' && e.newValue) {
          try {
            const refreshData = JSON.parse(e.newValue);
            if (refreshData.type === 'leave' || refreshData.type === 'all') {
              handleGlobalRefresh();
            }
          } catch (err) {
            console.error('Error parsing global refresh data:', err);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchCapacityData]);

    const hocProps: WithCapacityDataProps = {
      capacityData,
      refreshCapacityData,
      isRefreshing
    };

    return <WrappedComponent {...props} {...hocProps} />;
  };
}

// Pre-configured components for different user roles
export const ManagerCapacityData = withCapacityData(
  ({ capacityData, refreshCapacityData, isRefreshing, ...props }: WithCapacityDataProps & any) => {
    return (
      <div {...props}>
        {/* This will be used by Manager Capacity components */}
        {props.children}
      </div>
    );
  },
  { autoFetch: true, refreshInterval: 30000, includeEmployeeDetails: true }
);

export const AdminCapacityData = withCapacityData(
  ({ capacityData, refreshCapacityData, isRefreshing, ...props }: WithCapacityDataProps & any) => {
    return (
      <div {...props}>
        {/* This will be used by Admin Capacity components */}
        {props.children}
      </div>
    );
  },
  { autoFetch: true, refreshInterval: 30000, includeEmployeeDetails: true }
);
