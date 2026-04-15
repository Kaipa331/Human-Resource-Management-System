// Centralized error handling utilities
import { toast } from 'sonner';

export interface ErrorContext {
  action?: string;
  component?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Common error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

// Error factory functions
export const createError = {
  validation: (message: string, context?: ErrorContext) => 
    new AppError(message, ErrorTypes.VALIDATION_ERROR, 400, context),
  
  authentication: (message: string = 'Authentication required', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.AUTHENTICATION_ERROR, 401, context),
  
  authorization: (message: string = 'Access denied', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.AUTHORIZATION_ERROR, 403, context),
  
  network: (message: string = 'Network error occurred', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.NETWORK_ERROR, 0, context),
  
  database: (message: string = 'Database operation failed', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.DATABASE_ERROR, 500, context),
  
  fileUpload: (message: string = 'File upload failed', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.FILE_UPLOAD_ERROR, 400, context),
  
  rateLimit: (message: string = 'Too many requests', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.RATE_LIMIT_ERROR, 429, context),
  
  notFound: (message: string = 'Resource not found', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.NOT_FOUND_ERROR, 404, context),
  
  conflict: (message: string = 'Resource conflict', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.CONFLICT_ERROR, 409, context),
  
  timeout: (message: string = 'Operation timed out', context?: ErrorContext) => 
    new AppError(message, ErrorTypes.TIMEOUT_ERROR, 408, context),
};

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: Array<{ error: Error; context?: ErrorContext; timestamp: number }> = [];
  private maxQueueSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle different types of errors
  handle(error: Error | AppError, context?: ErrorContext): void {
    const timestamp = Date.now();
    
    // Add to error queue
    this.errorQueue.push({ error, context, timestamp });
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log error
    this.logError(error, context);

    // Show user-friendly message
    this.showUserMessage(error);

    // Send to external service in production
    if (import.meta.env.PROD) {
      this.sendToExternalService(error, context);
    }
  }

  private logError(error: Error, context?: ErrorContext): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as AppError).code,
      statusCode: (error as AppError).statusCode,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Application Error:', errorInfo);
  }

  private showUserMessage(error: Error | AppError): void {
    const appError = error as AppError;
    let message = 'An unexpected error occurred';
    let type: 'error' | 'warning' | 'info' = 'error';

    switch (appError.code) {
      case ErrorTypes.VALIDATION_ERROR:
        message = appError.message || 'Please check your input and try again';
        type = 'warning';
        break;
      case ErrorTypes.AUTHENTICATION_ERROR:
        message = 'Please log in to continue';
        type = 'warning';
        break;
      case ErrorTypes.AUTHORIZATION_ERROR:
        message = 'You do not have permission to perform this action';
        type = 'warning';
        break;
      case ErrorTypes.NETWORK_ERROR:
        message = 'Connection error. Please check your internet connection';
        type = 'error';
        break;
      case ErrorTypes.RATE_LIMIT_ERROR:
        message = 'Too many requests. Please wait a moment and try again';
        type = 'warning';
        break;
      case ErrorTypes.NOT_FOUND_ERROR:
        message = 'The requested resource was not found';
        type = 'info';
        break;
      case ErrorTypes.TIMEOUT_ERROR:
        message = 'Operation timed out. Please try again';
        type = 'warning';
        break;
      default:
        message = appError.message || message;
        type = 'error';
    }

    toast[type](message);
  }

  private async sendToExternalService(error: Error, context?: ErrorContext): Promise<void> {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as AppError).code,
        statusCode: (error as AppError).statusCode,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
      };

      // Send to your error tracking service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (err) {
      console.error('Failed to send error to external service:', err);
    }
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    recent: Array<{ error: Error; context?: ErrorContext; timestamp: number }>;
  } {
    const byType: Record<string, number> = {};
    
    this.errorQueue.forEach(({ error }) => {
      const code = (error as AppError).code || 'UNKNOWN';
      byType[code] = (byType[code] || 0) + 1;
    });

    return {
      total: this.errorQueue.length,
      byType,
      recent: this.errorQueue.slice(-10),
    };
  }

  // Clear error queue
  clearErrors(): void {
    this.errorQueue = [];
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions
export const handleError = (error: Error | AppError, context?: ErrorContext): void => {
  errorHandler.handle(error, context);
};

export const handleAsyncError = async (
  asyncFn: () => Promise<any>,
  context?: ErrorContext
): Promise<any> => {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error as Error, context);
    throw error;
  }
};

// React hook for error handling
export const useErrorHandler = () => {
  const handleReactError = (error: Error, context?: ErrorContext) => {
    handleError(error, context);
  };

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      handleReactError(error as Error, context);
      return null;
    }
  };

  return {
    handleError: handleReactError,
    handleAsyncOperation,
  };
};

// Supabase error handler
export const handleSupabaseError = (error: any, context?: ErrorContext): AppError => {
  if (!error) {
    return createError.database('Unknown database error', context);
  }

  const message = error.message || 'Database operation failed';
  const code = error.code || 'DATABASE_ERROR';

  // Map Supabase error codes to our error types
  switch (code) {
    case 'PGRST116':
      return createError.notFound('Record not found', context);
    case 'PGRST301':
      return createError.authorization('Row level security violation', context);
    case '23505':
      return createError.conflict('Duplicate entry', context);
    case '23503':
      return createError.validation('Foreign key constraint violation', context);
    case '23502':
      return createError.validation('Required field missing', context);
    case '42501':
      return createError.authorization('Insufficient privileges', context);
    case '28P01':
      return createError.authentication('Database authentication failed', context);
    case '08006':
    case '08001':
      return createError.network('Database connection failed', context);
    default:
      return createError.database(message, context);
  }
};

// Network error handler
export const handleNetworkError = (error: any, context?: ErrorContext): AppError => {
  if (!error) {
    return createError.network('Unknown network error', context);
  }

  if (error.name === 'AbortError') {
    return createError.timeout('Request was aborted', context);
  }

  if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
    return createError.network('Network connection failed', context);
  }

  if (error.status === 429) {
    return createError.rateLimit('Rate limit exceeded', context);
  }

  if (error.status === 401) {
    return createError.authentication('Authentication required', context);
  }

  if (error.status === 403) {
    return createError.authorization('Access denied', context);
  }

  if (error.status === 404) {
    return createError.notFound('Resource not found', context);
  }

  if (error.status === 409) {
    return createError.conflict('Resource conflict', context);
  }

  return createError.network(error.message || 'Network error occurred', context);
};
