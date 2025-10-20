import { useState, useCallback } from 'react';

interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: React.ReactNode;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm: (() => void) | null;
  loading: boolean;
}

export const useConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    icon: undefined,
    onConfirm: null,
    loading: false,
  });

  const confirm = useCallback((options: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        ...options,
        onConfirm: () => {
          setState(prev => ({ ...prev, loading: true }));
          resolve(true);
        },
        loading: false,
      });
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
      loading: false,
    }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (state.onConfirm) {
      try {
        await state.onConfirm();
      } finally {
        close();
      }
    }
  }, [state.onConfirm, close]);

  return {
    confirm,
    close,
    handleConfirm,
    isOpen: state.isOpen,
    title: state.title,
    description: state.description,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    icon: state.icon,
    loading: state.loading,
  };
};
