import type { ISuiteResult, SuiteFailure } from '@/shared/types';

/** Some tests run from another copy of a suite, outside the project's runs: how each went, or why none ran, with what Playwright said. */
export interface ISuiteCheck {
  results: ISuiteResult[];
  failure: SuiteFailure | null;
  said: string;
}
