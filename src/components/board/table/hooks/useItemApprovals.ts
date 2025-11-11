// Hook for managing item approvals

import { useState, useCallback } from 'react';
import { approvalAPI } from '@/lib/api';

export const useItemApprovals = () => {
  const [itemApprovals, setItemApprovals] = useState<Record<string, any>>({});

  const fetchItemApproval = useCallback(async (itemId: string) => {
    try {
      const response = await approvalAPI.getItemApprovals(itemId);
      if (response.success && response.data) {
        setItemApprovals(prev => ({
          ...prev,
          [itemId]: response.data,
        }));
      }
    } catch (error) {
      // Silently fail - approvals are optional
      console.error('Error fetching approval status:', error);
    }
  }, []);

  return {
    itemApprovals,
    fetchItemApproval,
  };
};

