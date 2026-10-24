import type { IProSyncRun } from '@/shared/types';

/** The screens a run's steps left in the archive, once each. */
export function runFilesOf(run: IProSyncRun): string[] {
  return [
    ...new Set(
      run.cases.flatMap((runCase) =>
        runCase.steps.flatMap(({ shotFile }) => (shotFile === null ? [] : [shotFile])),
      ),
    ),
  ];
}
