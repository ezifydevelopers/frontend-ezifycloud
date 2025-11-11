// AI API endpoints
import { apiRequest } from './base';
import { ApiResponse } from '../../types/api';

export const aiAPI = {
  // Generate text (description, comment, email, summary)
  generateText: (data: {
    type: 'description' | 'comment' | 'email' | 'summary';
    context?: Record<string, unknown>;
  }): Promise<ApiResponse<{ text: string; confidence?: number; metadata?: Record<string, unknown> }>> =>
    apiRequest('/ai/generate-text', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Smart semantic search
  smartSearch: (data: {
    query: string;
    boardId?: string;
    workspaceId?: string;
    limit?: number;
    filters?: Record<string, unknown>;
  }): Promise<ApiResponse<{
    results: Array<{
      itemId: string;
      itemName: string;
      relevanceScore: number;
      matchedFields: string[];
    }>;
    queryInterpretation?: string;
    suggestedFilters?: Record<string, unknown>;
  }>> =>
    apiRequest('/ai/smart-search', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generate predictions
  generatePrediction: (data: {
    type: 'payment_delay' | 'approval_time' | 'risk_score';
    itemId?: string;
    itemData?: Record<string, unknown>;
  }): Promise<ApiResponse<{
    prediction: number | string;
    confidence: number;
    factors?: Array<{ factor: string; impact: number }>;
    recommendation?: string;
  }>> =>
    apiRequest('/ai/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generate insights
  generateInsights: (data: {
    type: 'board_summary' | 'team_insights' | 'trends';
    boardId?: string;
    workspaceId?: string;
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<ApiResponse<{
    summary: string;
    metrics?: Array<{ label: string; value: string | number }>;
    trends?: Array<{ label: string; description: string; direction: string }>;
    insights?: string[];
  }>> =>
    apiRequest('/ai/insights', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

