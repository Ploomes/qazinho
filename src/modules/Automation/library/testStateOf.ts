import type { ILastResult, SuiteTestState } from '@/modules/Automation/types';

/** How a test stands on screen: running now, how it went the last time a run reached it, or not run yet; a pass on a retry reads as flaky. */
export function testStateOf(props: {
  isGoing: boolean;
  last: ILastResult | undefined;
}): SuiteTestState {
  const { isGoing, last } = props;

  if (isGoing) return 'running';

  if (last === undefined) return 'pending';

  if (last.result.isFlaky) return 'flaky';

  if (last.result.status === 'passed') return 'passed';

  return last.result.status === 'skipped' ? 'skipped' : 'failed';
}
