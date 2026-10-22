import type { ISuiteResult, SuiteResultState } from '@/modules/Automation/types';

/** How a test went in one run as the QA reads it: a pass on a retry is flaky, anything else what Playwright said. */
export function resultStateOf(
  result: Pick<ISuiteResult, 'status' | 'isFlaky'>,
): SuiteResultState {
  return result.status === 'passed' && result.isFlaky ? 'flaky' : result.status;
}
