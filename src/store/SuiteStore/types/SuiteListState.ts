import type { SuiteList } from '@/shared/types';

/** A suite's tests as the page has them: still being listed, listed, or why they could not be. */
export type SuiteListState = { kind: 'loading' } | SuiteList;
