import type { ISuiteResult, SuiteRunStatus } from '@/shared/types';

/**
 * How a run ended: stopped by the QA, broken when Playwright could not see it through,
 * failed when a test did not pass, passed otherwise.
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
