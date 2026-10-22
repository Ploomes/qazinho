/** Where a run of a suite stands: going, every test as expected, some failed, stopped by the QA, or broken before its tests could tell. */
export type SuiteRunStatus = 'running' | 'passed' | 'failed' | 'stopped' | 'broke';
