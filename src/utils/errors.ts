export class SyncError extends Error {
  constructor(
    message: string,
    public readonly type: 'network' | 'validation' | 'mapping' | 'business' | 'rate_limit',
    public readonly retryable: boolean = false,
    public readonly originalError?: Error,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class CupSolidaleError extends SyncError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cupErrorCode?: string,
    retryable: boolean = false,
    originalError?: Error
  ) {
    super(message, 'network', retryable, originalError, {
      service: 'cup-solidale',
      statusCode,
      cupErrorCode
    });
    this.name = 'CupSolidaleError';
  }
}

export class GoHighLevelError extends SyncError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    retryable: boolean = false,
    originalError?: Error
  ) {
    super(message, 'network', retryable, originalError, {
      service: 'gohighlevel',
      statusCode
    });
    this.name = 'GoHighLevelError';
  }
}

export class MappingError extends SyncError {
  constructor(
    message: string,
    public readonly entityType: string,
    public readonly entityId: string,
    originalError?: Error
  ) {
    super(message, 'mapping', false, originalError, {
      entityType,
      entityId
    });
    this.name = 'MappingError';
  }
}

export class ValidationError extends SyncError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any,
    originalError?: Error
  ) {
    super(message, 'validation', false, originalError, {
      field,
      value
    });
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends SyncError {
  constructor(
    message: string,
    public readonly service: string,
    public readonly retryAfter?: number,
    originalError?: Error
  ) {
    super(message, 'rate_limit', true, originalError, {
      service,
      retryAfter
    });
    this.name = 'RateLimitError';
  }
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof SyncError) {
    return error.retryable;
  }

  // Network errors are generally retryable
  if (error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')) {
    return true;
  }

  return false;
}

export function getErrorContext(error: Error): Record<string, any> {
  if (error instanceof SyncError) {
    return {
      type: error.type,
      retryable: error.retryable,
      context: error.context,
      originalError: error.originalError?.message
    };
  }

  return {
    type: 'unknown',
    retryable: false,
    message: error.message
  };
}