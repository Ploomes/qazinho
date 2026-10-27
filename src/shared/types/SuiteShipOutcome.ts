import type { ISuiteChange } from './ISuiteChange';

/**
 * How sending a change went: the change as it now stands, or the step that failed with
 * what git or GitHub said, and the change as far as it got.
 */
export type SuiteShipOutcome =
  | { isOk: true; change: ISuiteChange }
  | {
      isOk: false;
      step: 'commit' | 'push' | 'pull-request';
      said: string;
      change: ISuiteChange;
    };
