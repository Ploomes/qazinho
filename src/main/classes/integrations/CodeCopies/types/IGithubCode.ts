import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';

/**
 * What CodeCopies needs from gh: requests to GitHub's REST API, and an archive unpacked
 * into a folder.
 */
export interface IGithubCode {
  api: (props: { path: string; accept?: string; jq?: string }) => Promise<GhAnswer>;
  extract: (props: {
    path: string;
    dir: string;
    onBytes?: (bytes: number) => void;
  }) => Promise<GhAnswer>;
}
