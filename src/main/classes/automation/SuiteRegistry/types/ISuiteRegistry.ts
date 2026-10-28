import type { GitCli } from '@/main/classes/automation/GitCli';

/**
 * O que o registro precisa: a pasta onde guarda a lista dele, e o git do QA para ler a
 * branch e o remoto de cada suíte.
 */
export interface ISuiteRegistry {
  root: string;
  git: Pick<GitCli, 'run'>;
}
