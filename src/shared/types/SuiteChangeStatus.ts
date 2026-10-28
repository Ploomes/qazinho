/** Em que pé está uma mudança numa suíte. */
export type SuiteChangeStatus =
  | 'working'
  | 'ready'
  | 'app-bug'
  | 'gave-up'
  | 'broke'
  | 'stopped'
  | 'shipped'
  | 'discarded';
