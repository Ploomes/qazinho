import type { ISuiteResult } from '@/shared/types';

/** How a test went the last time a run reached it, and in which run. */
export interface ILastResult {
  result: ISuiteResult;
  runId: string;
  endedAt: number | null;
}
