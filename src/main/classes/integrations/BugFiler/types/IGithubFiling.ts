import type { GithubCli } from '@/main/classes/integrations/GithubCli';

/** O que registrar um bug pede ao GitHub, pelo gh do QA. */
export type IGithubFiling = Pick<GithubCli, 'api'>;
