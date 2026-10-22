import type { ISuiteRun } from '@/shared/types';
import type { ChildProcess } from 'node:child_process';

/** A run going: its record so far, how many tests the page expected and Playwright counted, the Playwright walking its batch, and whether the QA stopped it or Playwright broke before saying it ended. */
export interface ISuiteJob {
  run: ISuiteRun;
  expected: number;
  counted: number;
  child: ChildProcess | null;
  isStopping: boolean;
  isBroken: boolean;
}
