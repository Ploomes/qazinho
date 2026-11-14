import type { GithubCli } from '@/main/classes/integrations/GithubCli';
import type { SiteFetcher } from '@/main/classes/projects/SiteIcons/types';

/**
 * Por onde o nome de um app é lido: a página, um comando do sistema e o aapt2 do SDK do
 * QA, e o GitHub dele.
 */
export interface IAppNamesProps {
  fetcher: SiteFetcher;
  run: (props: { command: string; args: string[] }) => Promise<string | null>;
  aapt: () => Promise<string | null>;
  isMac: boolean;
  github: Pick<GithubCli, 'api'>;
}
