import type { IVariableValue } from '@/main/types';
import type { ISuiteRun } from '@/shared/types';
import type { ChildProcess } from 'node:child_process';

/**
 * A suite run going: its record so far, its counts, its Playwright, and whether it
 * stopped or broke.
 */
export interface ISuiteJob {
  run: ISuiteRun;
  values: IVariableValue[];
  expected: number;
  counted: number;
  child: ChildProcess | null;
  isStopping: boolean;
  isBroken: boolean;
  isQuiet: boolean;
}
