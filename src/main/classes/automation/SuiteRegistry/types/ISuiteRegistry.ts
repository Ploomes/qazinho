import type { GitCli } from '@/main/classes/automation/GitCli';

/**
 * What the registry needs: the folder it keeps its list in, and the QA's git to read each
 * suite's branch and remote.
 */
export interface ISuiteRegistry {
  root: string;
  git: Pick<GitCli, 'run'>;
}
