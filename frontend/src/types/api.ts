/**
 * Common API types and interfaces
 */

/**
 * Standard API error response
 */
export interface ApiError extends Error {
  /** Error message */
  error: string;
  /** HTTP status code */
  status: number;
  /** Request ID for tracking */
  requestId?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    redis: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
  metrics?: {
    totalItems?: number;
    totalPrices?: number;
    cacheHitRate?: number;
    requestsPerMinute?: number;
  };
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
}

/**
 * Pagination metadata in API responses
 */
export interface PaginationMetadata {
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
}

/**
 * Sort parameters
 */
export interface SortParams {
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Success status */
  success: boolean;
  /** Optional message */
  message?: string;
}

/**
 * Query parameters for data fetching
 */
export interface QueryParams extends PaginationParams, SortParams {
  [key: string]: string | number | boolean | undefined;
}
