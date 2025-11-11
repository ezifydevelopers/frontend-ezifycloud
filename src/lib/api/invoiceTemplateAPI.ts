// Invoice template API endpoints

import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';
import { InvoiceTemplate } from '@/types/invoice';

export const invoiceTemplateAPI = {
  /**
   * Get all invoice templates
   */
  getTemplates: (workspaceId?: string): Promise<ApiResponse<InvoiceTemplate[]>> =>
    apiRequest(`/invoice-templates${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),

  /**
   * Get template by ID
   */
  getTemplate: (templateId: string): Promise<ApiResponse<InvoiceTemplate>> =>
    apiRequest(`/invoice-templates/${templateId}`),

  /**
   * Create new template
   */
  createTemplate: (data: {
    name: string;
    description?: string;
    config: InvoiceTemplate['config'];
    workspaceId?: string;
  }): Promise<ApiResponse<InvoiceTemplate>> =>
    apiRequest('/invoice-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update template
   */
  updateTemplate: (
    templateId: string,
    data: {
      name?: string;
      description?: string;
      config?: InvoiceTemplate['config'];
    }
  ): Promise<ApiResponse<InvoiceTemplate>> =>
    apiRequest(`/invoice-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete template
   */
  deleteTemplate: (templateId: string): Promise<ApiResponse<{ message: string }>> =>
    apiRequest(`/invoice-templates/${templateId}`, {
      method: 'DELETE',
    }),

  /**
   * Set default template
   */
  setDefaultTemplate: (templateId: string): Promise<ApiResponse<InvoiceTemplate>> =>
    apiRequest(`/invoice-templates/${templateId}/set-default`, {
      method: 'POST',
    }),
};

