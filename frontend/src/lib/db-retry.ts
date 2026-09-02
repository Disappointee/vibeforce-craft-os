/**
 * 🛡️ SQLite WAL Mode & Client Write Retry Engine
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Provides exponential backoff with full jitter for handling transient SQLite
 * lock contention (SQLITE_BUSY / database is locked) under high write concurrency.
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  retryOn?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  baseDelayMs: 100,
  maxDelayMs: 3000,
  jitterFactor: 0.3,
  retryOn: isTransientDbError,
};

/**
 * Checks if an error is a transient SQLite or network contention error.
 */
export function isTransientDbError(err: unknown): boolean {
  if (!err) return false;

  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  // SQLite Contention keywords
  if (
    msg.includes('sqlite_busy') ||
    msg.includes('database is locked') ||
    msg.includes('database table is locked') ||
    msg.includes('busy_timeout') ||
    msg.includes('cannot start a transaction within a transaction') ||
    msg.includes('autocancelled') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  ) {
    return true;
  }

  // PocketBase / ClientResponseError specific status codes
  const status = (err as { status?: number; response?: { status?: number } }).status ||
                 (err as { status?: number; response?: { status?: number } }).response?.status;

  if (status === 429 || status === 503 || status === 504) {
    return true;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an asynchronous database or API operation with exponential backoff & jitter.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      if (attempt === config.maxRetries || !config.retryOn(err)) {
        throw err;
      }

      // Exponential delay: baseDelay * 2^attempt
      const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
      const cappedDelay = Math.min(config.maxDelayMs, exponentialDelay);

      // Add jitter to prevent thundering herd
      const jitter = cappedDelay * config.jitterFactor * (Math.random() * 2 - 1);
      const finalDelay = Math.max(10, Math.round(cappedDelay + jitter));

      console.warn(
        `[DB-RETRY] Transient DB contention (attempt ${attempt + 1}/${config.maxRetries + 1}). Retrying in ${finalDelay}ms... Error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );

      await sleep(finalDelay);
    }
  }

  throw lastError;
}
