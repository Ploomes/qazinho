import type { INetworkEntry } from '@/shared/types';

const SHOWN = 20;
const BODY_CHARS = 300;
const LEFT_OUT = ['image', 'font', 'media', 'stylesheet'];

/**
 * Os pedidos que falharam numa run como um agente os lê, com o que uma chamada de API
 * respondeu; os que o próprio navegador cancelou não contam.
 */
export function failedCallsOf(network: INetworkEntry[] | null): string[] {
  const failed = (network ?? []).filter(
    ({ status, failure, type }) =>
      !LEFT_OUT.includes(type) &&
      ((status !== null && status >= 400) ||
        (failure !== null && !failure.includes('ABORTED'))),
  );

  if (failed.length === 0) return [];

  return [
    'Requests that failed:',
    ...failed.slice(0, SHOWN).map((entry) => {
      const body = entry.body?.trim().slice(0, BODY_CHARS) ?? '';

      return `  ${entry.method} ${entry.url} → ${entry.status === null ? (entry.failure ?? 'failed') : String(entry.status)}${body === '' ? '' : `: ${body}`}`;
    }),
    ...(failed.length > SHOWN ? [`  and ${String(failed.length - SHOWN)} more.`] : []),
  ];
}
