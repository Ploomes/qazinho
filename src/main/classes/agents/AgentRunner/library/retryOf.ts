import type { IAgentLine } from '@/main/types';

/**
 * A tentativa em que um agente está quando não alcançou o próprio serviço e espera para
 * tentar de novo; null para qualquer outra linha.
 */
export function retryOf(
  line: IAgentLine,
): { attempt: number; maxRetries: number } | null {
  if (line.type !== 'system' || line.subtype !== 'api_retry') return null;

  if (typeof line.attempt !== 'number') return null;

  return { attempt: line.attempt, maxRetries: line.max_retries ?? line.attempt };
}
