import { toast } from '@/hooks/use-toast';
import { FieldErrors } from 'react-hook-form';

/**
 * Handle form validation errors and show toast messages
 */
export const handleFormValidationErrors = (errors: FieldErrors) => {
  const errorFields = Object.keys(errors);
  
  if (errorFields.length > 0) {
    const firstError = errors[errorFields[0]];
    const errorMessage = firstError?.message || 'Please check your form for errors';
    
    toast({
      title: 'Form validation failed',
      description: errorMessage,
      variant: 'destructive',
    });
    
    return true; // Indicates there are validation errors
  }
  
  return false; // No validation errors
};

/**
 * Show success toast for form submission
 */
export const showFormSuccessToast = (message: string, description?: string) => {
  toast({
    title: 'Success',
    description: message,
  });
};

/**
 * Show error toast for form submission
 */
export const showFormErrorToast = (message: string, description?: string) => {
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
};

/**
 * Show loading toast for form submission
 */
export const showFormLoadingToast = (message: string, description?: string) => {
  toast({
    title: 'Processing...',
    description: message,
  });
};
