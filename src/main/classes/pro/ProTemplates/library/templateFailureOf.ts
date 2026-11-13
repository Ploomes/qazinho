import type { OrgTemplateFailure } from '@/shared/types';

/** Por que a org recusou um pedido sobre modelos, pelo status da resposta. */
export function templateFailureOf(status: number): OrgTemplateFailure {
  if (status === 401) return 'signed-out';
  if (status === 403) return 'forbidden';

  return status === 0 || status >= 500 ? 'unreachable' : 'failed';
}
