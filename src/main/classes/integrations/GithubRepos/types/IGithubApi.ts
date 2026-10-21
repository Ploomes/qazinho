import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';

/** The one thing GithubRepos needs from gh: a request to GitHub's REST API as the QA. */
export interface IGithubApi {
  api: (props: {
    path: string;
    accept?: string;
    paginate?: boolean;
    jq?: string;
  }) => Promise<GhAnswer>;
}
