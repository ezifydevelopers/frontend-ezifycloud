// Approval workflow API

import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';

export interface ApprovalWorkflowConfig {
  id: string;
  boardId: string;
  name: string;
  description?: string;
  levels: ApprovalLevelConfig[];
  rules: ApprovalRule[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalLevelConfig {
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  name: string;
  approvers: string[];
  isOptional: boolean;
  isParallel: boolean;
  requiredApprovals?: number;
  timeoutHours?: number;
  escalationUserId?: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  type: 'amount' | 'status' | 'custom';
  condition: ApprovalCondition;
  action: ApprovalAction;
  priority: number;
  enabled: boolean;
}

export interface ApprovalCondition {
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'and' | 'or';
  field?: string;
  value?: unknown;
  conditions?: ApprovalCondition[];
}

export interface ApprovalAction {
  type: 'require_level' | 'skip_level' | 'auto_approve' | 'assign_approver';
  level?: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  skipToLevel?: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  approverIds?: string[];
  message?: string;
}

export interface ApprovalWorkflowEvaluation {
  requiredLevels: ('LEVEL_1' | 'LEVEL_2' | 'LEVEL_3')[];
  skippedLevels: ('LEVEL_1' | 'LEVEL_2' | 'LEVEL_3')[];
  autoApproved: boolean;
  assignedApprovers: Record<'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3', string[]>;
  routingRules: ApprovalRule[];
}

export const workflowAPI = {
  /**
   * Get workflow configuration for a board
   */
  getWorkflow: (boardId: string): Promise<ApiResponse<ApprovalWorkflowConfig>> =>
    apiRequest(`/approvals/boards/${boardId}/workflow`),

  /**
   * Save workflow configuration
   */
  saveWorkflow: (
    boardId: string,
    config: ApprovalWorkflowConfig
  ): Promise<ApiResponse<ApprovalWorkflowConfig>> =>
    apiRequest(`/approvals/boards/${boardId}/workflow`, {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  /**
   * Evaluate workflow for an item
   */
  evaluateWorkflow: (
    boardId: string,
    itemId: string
  ): Promise<ApiResponse<ApprovalWorkflowEvaluation>> =>
    apiRequest(`/approvals/boards/${boardId}/items/${itemId}/evaluate-workflow`, {
      method: 'POST',
    }),
};

