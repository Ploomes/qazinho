import type { ConnectFailure } from '@/shared/types';

/**
 * Why a tracker's answer is not a yes, or null when it is one. No answer at all means it
 * was unreachable.
 */
export function trackerRefusal(
  answer: { ok: boolean; status: number } | null,
): ConnectFailure | null {
  if (answer === null) return { reason: 'unreachable' };
  if (answer.ok) return null;
  if (answer.status === 401 || answer.status === 403) return { reason: 'unauthorized' };

  return { reason: 'unexpected', status: answer.status };
}
