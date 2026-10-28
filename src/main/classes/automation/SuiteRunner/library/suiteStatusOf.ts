import type { ISuiteResult, SuiteRunStatus } from '@/shared/types';

/**
 * Como uma run terminou: parada pelo QA, quebrada quando o Playwright não conseguiu
 * levá-la até o fim, falhou quando um teste não passou, passou nos outros casos.
 */
export function suiteStatusOf(props: {
  results: ISuiteResult[];
  isStopped: boolean;
  isBroken: boolean;
}): SuiteRunStatus {
  if (props.isStopped) return 'stopped';

  if (props.isBroken) return 'broke';

  return props.results.some(
    ({ status }) =>
      status === 'failed' || status === 'timedOut' || status === 'interrupted',
  )
    ? 'failed'
    : 'passed';
}
