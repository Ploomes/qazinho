import type { ProRemoval } from '@/shared/types';

/**
 * O que a resposta da plataforma a apagar um projeto significa aqui: um projeto que ela
 * não tem mais conta como apagado.
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
