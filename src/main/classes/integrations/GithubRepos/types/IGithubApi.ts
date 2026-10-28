import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';

/**
 * A única coisa que o GithubRepos precisa do gh: um pedido à API REST do GitHub como o
 * QA.
 */
export interface IGithubApi {
  api: (props: {
    path: string;
    accept?: string;
    paginate?: boolean;
    jq?: string;
  }) => Promise<GhAnswer>;
}
