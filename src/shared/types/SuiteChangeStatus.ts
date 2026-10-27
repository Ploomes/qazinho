/** Where a change to a suite stands. */
export type SuiteChangeStatus =
  | 'working'
  | 'ready'
  | 'app-bug'
  | 'gave-up'
  | 'broke'
  | 'stopped'
  | 'shipped'
  | 'discarded';
