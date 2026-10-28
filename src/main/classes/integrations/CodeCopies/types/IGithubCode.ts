import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';

/**
 * O que o CodeCopies precisa do gh: pedidos à API REST do GitHub, e um arquivo
 * desempacotado numa pasta.
 */
export interface IGithubCode {
  api: (props: { path: string; accept?: string; jq?: string }) => Promise<GhAnswer>;
  extract: (props: {
    path: string;
    dir: string;
    onBytes?: (bytes: number) => void;
  }) => Promise<GhAnswer>;
}
