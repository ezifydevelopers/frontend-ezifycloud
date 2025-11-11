// API Index - Re-exports all APIs for backward compatibility
// This maintains the existing import structure while using the new modular API files

export { apiRequest, getApiBaseUrl } from './base';

export { authAPI } from './authAPI';
export { userAPI } from './userAPI';
export { leaveAPI } from './leaveAPI';
export { adminAPI } from './adminAPI';
export { managerAPI } from './managerAPI';
export { employeeAPI } from './employeeAPI';
export { workspaceAPI } from './workspaceAPI';
export { boardAPI } from './boardAPI';
export { itemAPI } from './itemAPI';
export { commentAPI } from './commentAPI';
export { automationAPI } from './automationAPI';
export { aiAPI } from './aiAPI';
export { fileAPI } from './fileAPI';
export { permissionAPI } from './permissionAPI';
export { auditAPI } from './auditAPI';
export { dashboardAPI } from './dashboardAPI';
export { reportAPI } from './reportAPI';
export { approvalAPI } from './approvalAPI';
export { invoiceAPI } from './invoiceAPI';
export { invoiceTemplateAPI } from './invoiceTemplateAPI';
export { workflowAPI } from './workflowAPI';
export { approvalHistoryAPI } from './approvalHistoryAPI';
export { notificationAPI } from './notificationAPI';
export { approvalNotificationAPI } from './approvalNotificationAPI';
export { viewAPI } from './viewAPI';

