import type { SuiteTestStatus } from '@/shared/types';

/**
 * Como um teste foi numa run, como o QA lê: o que o Playwright disse, e um passe numa
 * nova tentativa distinguido como flaky.
 */
export type SuiteResultState = SuiteTestStatus | 'flaky';
