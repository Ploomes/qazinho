import type { McpSignInProgress } from '@/shared/types';

/**
 * O que o AgentMcp precisa: as CLIs de agente, como abrir uma URL ou rodar um script, e
 * onde relatar.
 */
export interface IAgentMcp {
  findAgent: (agentId: string) => Promise<string | null>;
  openUrl: (url: string) => Promise<void>;
  openScript: (file: string) => Promise<boolean>;
  onProgress: (progress: McpSignInProgress) => void;
  folder: string;
}
