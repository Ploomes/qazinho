import type { ISuiteChange } from '@/modules/Automation/types';

/** The new tests the QA asked their agent for and did not throw away, the latest first. */
export function requestsOf(changes: ISuiteChange[]): ISuiteChange[] {
  return changes
    .filter(({ ask, status }) => ask.kind === 'write' && status !== 'discarded')
    .sort((one, other) => other.startedAt - one.startedAt);
}
