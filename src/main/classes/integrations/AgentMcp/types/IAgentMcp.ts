import type { McpSignInProgress } from '@/shared/types';

/**
 * What AgentMcp needs: the agent CLIs, how to open a URL or run a script, and where to
 * report.
 */
export interface IAgentMcp {
  findAgent: (agentId: string) => Promise<string | null>;
  openUrl: (url: string) => Promise<void>;
  openScript: (file: string) => Promise<boolean>;
  onProgress: (progress: McpSignInProgress) => void;
  folder: string;
}
