import type { RequestOutcome } from '@/modules/Run/types';
import { NETWORK } from '@/modules/Run/constants';

/** How a request ended: by the class of its status, even when the browser stopped reading the answer after it came, or by its failure when none came. */
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
