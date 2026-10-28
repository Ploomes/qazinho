import type { IProSyncRun } from '@/shared/types';

/** As telas que os passos de uma run deixaram no arquivo, uma vez cada. */
export function runFilesOf(run: IProSyncRun): string[] {
  return [
    ...new Set(
      run.cases.flatMap((runCase) =>
        runCase.steps.flatMap(({ shotFile }) => (shotFile === null ? [] : [shotFile])),
      ),
    ),
  ];
}
