import type { ISuiteResult } from '@/shared/types';

/** Como um teste foi na última vez que uma run o alcançou, e em qual run. */
export interface ILastResult {
  result: ISuiteResult;
  runId: string;
  endedAt: number | null;
}
