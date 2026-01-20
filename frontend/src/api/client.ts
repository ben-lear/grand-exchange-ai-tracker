/**
 * Axios client configuration for the OSRS GE Tracker API
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

/**
 * Base URL for the API - defaults to localhost for development
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Create and configure the axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds timestamp and request ID
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to request
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    // Generate a simple request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Request-ID'] = requestId;
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors and logging
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Enhanced error handling
    const apiError: ApiError = {
      name: 'ApiError',
      message: 'An unknown error occurred',
      error: 'An unknown error occurred',
      status: 500,
    };
    
    if (error.response) {
      // Server responded with error status
      const errorMsg = error.response.data?.error || error.message;
      apiError.name = 'ApiError';
      apiError.message = errorMsg;
      apiError.error = errorMsg;
      apiError.status = error.response.status;
      apiError.requestId = error.response.data?.requestId;
      apiError.details = error.response.data?.details;
      
      console.error('[API Response Error]', {
        status: error.response.status,
        url: error.config?.url,
        error: apiError,
      });
    } else if (error.request) {
      // Request made but no response received
      const errorMsg = 'No response from server. Please check your connection.';
      apiError.name = 'NetworkError';
      apiError.message = errorMsg;
      apiError.error = errorMsg;
      apiError.status = 0;
      
      console.error('[API Network Error]', error.message);
    } else {
      // Error in request configuration
      apiError.name = 'ConfigError';
      apiError.message = error.message;
      apiError.error = error.message;
      
      console.error('[API Config Error]', error.message);
    }
    
    return Promise.reject(apiError);
  }
);

/**
 * Health check function
 */
export const checkHealth = async () => {
  const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);
  return response.data;
};

/**
 * Export the configured axios instance
 */
export default apiClient;

/**
 * Export the base URL for reference
 */
export { API_BASE_URL };
