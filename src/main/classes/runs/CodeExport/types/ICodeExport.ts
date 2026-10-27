import type { ITargetUnderTest } from '@/shared/types';

/**
 * What CodeExport needs: where the workspaces keep their recipes, a folder the QA picks,
 * and the id of a phone app read from its file.
 */
export interface ICodeExport {
  dataRoot: string;
  chooseFolder: () => Promise<string | null>;
  appIdOf: (target: ITargetUnderTest) => Promise<string | null>;
}
