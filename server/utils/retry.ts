import { logger } from './logger.js';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  tag: string,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = true, onRetry } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxAttempts) {
        const wait = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        logger.warn(tag, `Tentativa ${attempt}/${maxAttempts} falhou. Retentando em ${wait}ms...`, {
          error: lastError.message,
        });
        if (onRetry) onRetry(attempt, lastError);
        await new Promise((r) => setTimeout(r, wait));
      } else {
        logger.error(tag, `Todas as ${maxAttempts} tentativas falharam.`, {
          error: lastError.message,
        });
      }
    }
  }

  throw lastError;
}
