import type { McpSignInProgress } from '@/shared/types';

/** What AgentMcp needs: where each agent CLI is, how to open a URL and a Terminal script, where to report a sign-in, and a folder. */
export interface IAgentMcp {
  findAgent: (agentId: string) => Promise<string | null>;
  openUrl: (url: string) => Promise<void>;
  openScript: (file: string) => Promise<void>;
  onProgress: (progress: McpSignInProgress) => void;
  folder: string;
}
