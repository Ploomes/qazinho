/** Where a change to a suite stands: the agent working, ready for the QA to review, the app wrong and the test right, the agent giving up, broken, stopped, sent, or thrown away. */
export type SuiteChangeStatus =
  | 'working'
  | 'ready'
  | 'app-bug'
  | 'gave-up'
  | 'broke'
  | 'stopped'
  | 'shipped'
  | 'discarded';
