import { logger } from './logger';
import { isRetryableError } from './errors';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
}

export const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBase: 2,
  jitter: true
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context?: string
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await operation();

      if (attempt > 0) {
        logger.info(`Operation succeeded after ${attempt} retries`, { context, attempt });
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt === opts.maxRetries) {
        logger.error(`Operation failed after ${opts.maxRetries} retries`, {
          context,
          error: lastError.message,
          attempts: attempt + 1
        });
        break;
      }

      if (!isRetryableError(lastError)) {
        logger.error('Non-retryable error encountered', {
          context,
          error: lastError.message,
          attempt
        });
        break;
      }

      const delay = calculateDelay(attempt, opts);

      logger.warn(`Operation failed, retrying in ${delay}ms`, {
        context,
        error: lastError.message,
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        delay
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  let delay = options.baseDelay * Math.pow(options.exponentialBase, attempt);

  // Apply maximum delay limit
  delay = Math.min(delay, options.maxDelay);

  // Add jitter to prevent thundering herd
  if (options.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.floor(delay);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        logger.info('Circuit breaker half-open, trying operation', { context });
      } else {
        throw new Error(`Circuit breaker is open for ${context || 'operation'}`);
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        logger.info('Circuit breaker closed, operation successful', { context });
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'open';
        logger.error('Circuit breaker opened due to failures', {
          context,
          failures: this.failures,
          threshold: this.failureThreshold
        });
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}