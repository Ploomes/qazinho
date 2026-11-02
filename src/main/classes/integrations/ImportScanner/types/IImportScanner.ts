import type { GitCli } from '@/main/classes/automation/GitCli';

export interface IImportScanner {
  git: Pick<GitCli, 'run'>;
}
