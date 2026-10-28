import type { AgentSignInProgress } from '@/shared/types';

/**
 * O que o AgentLogin precisa: onde está cada CLI de agente, como abrir uma página, onde
 * relatar um login, e uma pasta onde rodar.
 */
export interface IAgentLogin {
  findAgent: (agentId: string) => Promise<string | null>;
  openUrl: (url: string) => Promise<void>;
  onProgress: (progress: AgentSignInProgress) => void;
  folder: string;
}
