/**
 * Helper function to get the appropriate employee dashboard path based on employeeType
 * @param employeeType - The employee type ('onshore', 'offshore', or null/undefined)
 * @returns The dashboard path for the employee
 */
export const getEmployeeDashboardPath = (employeeType?: string | null): string => {
  if (employeeType === 'offshore') {
    return '/employee/offshore-dashboard';
  } else if (employeeType === 'onshore') {
    return '/employee/onshore-dashboard';
  } else {
    // Default to regular employee dashboard if type not set
    return '/employee/dashboard';
  }
};

