import type { IAgentLine } from '@/main/types';

/**
 * The try an agent is on when it could not reach its own service and waits to try again;
 * null for any other line.
 */
export function retryOf(
  line: IAgentLine,
): { attempt: number; maxRetries: number } | null {
  if (line.type !== 'system' || line.subtype !== 'api_retry') return null;

  if (typeof line.attempt !== 'number') return null;

  return { attempt: line.attempt, maxRetries: line.max_retries ?? line.attempt };
}
