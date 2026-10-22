/** Why a suite could not list or run its tests: no suite connected, its packages not installed, no node on this machine, or Playwright breaking before any test, as it said. */
export type SuiteFailure = 'no-suite' | 'no-runner' | 'no-node' | 'unreadable';
