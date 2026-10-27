import type { ProRemoval } from '@/shared/types';

/**
 * What the platform's answer to deleting a project means here: a project it no longer
 * has counts as deleted.
 */
export function removalOf(
  answer: { isOk: true } | { isOk: false; status: number; error: string },
): ProRemoval {
  if (answer.isOk || answer.error === 'project_not_found') return { isRemoved: true };
  if (answer.status === 0) return { isRemoved: false, failure: 'unreachable' };
  if (answer.status === 401) return { isRemoved: false, failure: 'signed-out' };
  if (answer.status === 403) return { isRemoved: false, failure: 'forbidden' };
  if (answer.error === 'project_busy') return { isRemoved: false, failure: 'busy' };

  return { isRemoved: false, failure: 'failed' };
}
