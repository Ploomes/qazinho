import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';

/** O que a biblioteca de skills precisa do gh: pedidos à API REST do GitHub como o QA. */
export interface IGithubSkills {
  api: (props: { path: string; jq?: string }) => Promise<GhAnswer>;
}
