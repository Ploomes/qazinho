import type { GithubCli } from '@/main/classes/integrations/GithubCli';

/** What filing a bug asks of GitHub, through the QA's gh. */
export type IGithubFiling = Pick<GithubCli, 'api'>;
