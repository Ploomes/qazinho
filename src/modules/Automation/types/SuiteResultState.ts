import type { SuiteTestStatus } from '@/shared/types';

/** How a test went in one run, as the QA reads it: what Playwright said, and a pass on a retry told apart as flaky. */
export type SuiteResultState = SuiteTestStatus | 'flaky';
