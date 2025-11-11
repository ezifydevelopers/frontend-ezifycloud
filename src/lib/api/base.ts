// Base API utilities for authenticated requests
import { APP_CONFIG } from '../config';

const API_BASE_URL = APP_CONFIG.API_BASE_URL;

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Request queue to prevent multiple simultaneous requests
const requestQueue = new Map<string, Promise<unknown>>();

// Make authenticated API request with retry logic
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  // Create a unique key for this request
  const requestKey = `${options.method || 'GET'}:${endpoint}`;
  
  // If the same request is already in progress, return the existing promise
  if (requestQueue.has(requestKey)) {
    return requestQueue.get(requestKey) as Promise<T>;
  }
  
  const makeRequest = async (): Promise<T> => {
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Debug logs disabled in production; keep silent by default

    try {
      // Add logging for debugging (only in development)
      if (import.meta.env.DEV) {
        console.log(`[API] ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (import.meta.env.DEV) {
        console.log(`[API] Response status: ${response.status} for ${endpoint}`);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, clear auth data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        
        if (response.status === 429) {
          // Rate limited - wait and retry once
          // silent retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || `HTTP error! status: ${retryResponse.status}`);
          }
          return retryResponse.json();
        }
        
        const errorData = await response.json().catch(() => ({}));
        
        // For 409 Conflict (like duplicate leave types), return the response instead of throwing
        if (response.status === 409) {
          // return conflict payload to caller
          return errorData;
        }
        
        // For validation errors, include the details
        if (response.status === 400 && errorData.details) {
          const validationDetails = errorData.details.map((d: {field: string, message: string}) => `${d.field}: ${d.message}`).join(', ');
          throw new Error(`${errorData.message || 'Validation failed'} - ${validationDetails}`);
        }
        
        // For 400 errors with "Access denied" message, preserve the message for proper handling
        if (response.status === 400 && (errorData.message?.includes('Access denied') || errorData.message?.includes('access denied'))) {
          throw new Error(errorData.message || 'Access denied');
        }
        
        // For 400 errors on file endpoints, include context
        if (response.status === 400 && endpoint.includes('/files/')) {
          throw new Error(errorData.message || errorData.error || 'Access denied');
        }
        
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData;
    } finally {
      // Remove from queue when done
      requestQueue.delete(requestKey);
    }
  };
  
  // Add to queue and return promise
  const promise = makeRequest();
  requestQueue.set(requestKey, promise);
  return promise;
};

// Helper to get API base URL
export const getApiBaseUrl = (): string => {
  return API_BASE_URL;
};

