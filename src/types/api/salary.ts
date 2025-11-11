// Salary Management API types

export interface EmployeeSalary {
  id: string;
  userId: string;
  baseSalary: number;
  hourlyRate?: number;
  currency: string;
  effectiveDate: string;
  endDate?: string;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
}

export interface SalaryDeduction {
  id: string;
  type: 'leave_deduction' | 'tax_deduction' | 'other_deduction' | 'bonus' | 'overtime';
  description: string;
  amount: number;
  leaveRequestId?: string;
  isTaxable: boolean;
  createdAt: string;
}

export interface MonthlySalary {
  id: string;
  userId: string;
  year: number;
  month: number;
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  calculatedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  approvedBy?: string;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  deductions: SalaryDeduction[];
}

export interface SalaryCalculation {
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  deductions: {
    leaveDeductions: number;
    taxDeductions: number;
    otherDeductions: number;
    bonuses: number;
    overtime: number;
  };
  leaveRequests: Array<{
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    deductionAmount: number;
  }>;
}

export interface SalaryStatistics {
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  averageSalary: number;
  leaveDeductions: number;
  taxDeductions: number;
}

