import type { AgentSignInProgress } from '@/shared/types';

/** What AgentLogin needs: where each agent CLI is, how to open a page, where to report a sign-in, and a folder to run in. */
export interface IAgentLogin {
  findAgent: (agentId: string) => Promise<string | null>;
  openUrl: (url: string) => Promise<void>;
  onProgress: (progress: AgentSignInProgress) => void;
  folder: string;
}
