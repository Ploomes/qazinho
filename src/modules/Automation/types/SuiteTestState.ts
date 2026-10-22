/** How a test stands on screen: running now, how it went the last time, or not run here yet. */
export type SuiteTestState =
  'running' | 'passed' | 'failed' | 'flaky' | 'skipped' | 'pending';
