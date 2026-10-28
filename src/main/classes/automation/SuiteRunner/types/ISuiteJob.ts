import type { IVariableValue } from '@/main/types';
import type { ISuiteRun } from '@/shared/types';
import type { ChildProcess } from 'node:child_process';

/**
 * Uma run de suíte em andamento: o registro dela até agora, as contagens, o Playwright
 * dela, e se parou ou quebrou.
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
