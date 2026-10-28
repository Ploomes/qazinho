import type { SuiteChangeAsk } from '@/modules/Automation/types';

const LONGEST = 72;

/**
 * Sobre o que uma mudança trata em uma linha: o teste que quebrou, ou o teste pedido,
 * pelo caso do plano dele ou pelas primeiras palavras do QA.
 */
export function requestTitleOf(ask: SuiteChangeAsk): string {
  if (ask.kind === 'fix') return ask.test.title;

  const [first = ''] = (ask.source?.title ?? ask.text).trim().split('\n');

  return first.length > LONGEST ? `${first.slice(0, LONGEST - 1).trimEnd()}…` : first;
}
