import type { RequestOutcome } from '@/modules/Run/types';
import { NETWORK } from '@/modules/Run/constants';

/**
 * Como um pedido terminou: pela classe do status, mesmo quando o navegador parou de ler a
 * resposta depois que ela veio, ou pela falha quando nenhuma veio.
 */
export function requestOutcomeOf(props: {
  status: number | null;
  failure: string | null;
}): RequestOutcome {
  const { status, failure } = props;
  const hasAnswer = status !== null && status >= 100;

  if (failure !== null && !NETWORK.canceled.test(failure)) return 'failed';

  if (!hasAnswer) return failure === null ? 'unknown' : 'canceled';

  if (status >= 500) return 'server';

  if (status >= 400) return 'client';

  return status >= 300 ? 'redirect' : 'ok';
}
