import type { ConnectFailure } from '@/shared/types';

/**
 * Por que a resposta de um tracker não é um sim, ou null quando é um. Nenhuma resposta
 * quer dizer que estava inalcançável.
 */
export function trackerRefusal(
  answer: { ok: boolean; status: number } | null,
): ConnectFailure | null {
  if (answer === null) return { reason: 'unreachable' };
  if (answer.ok) return null;
  if (answer.status === 401 || answer.status === 403) return { reason: 'unauthorized' };

  return { reason: 'unexpected', status: answer.status };
}
