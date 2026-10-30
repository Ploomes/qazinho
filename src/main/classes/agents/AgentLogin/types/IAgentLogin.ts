import type { AgentSignInProgress } from '@/shared/types';

/**
 * O que o AgentLogin precisa: onde está cada CLI de agente, como abrir um script num
 * terminal visível, onde relatar um login, e uma pasta onde rodar.
 */
export interface IAgentLogin {
  findAgent: (agentId: string) => Promise<string | null>;
  openScript: (file: string) => Promise<boolean>;
  onProgress: (progress: AgentSignInProgress) => void;
  folder: string;
  platform?: NodeJS.Platform;
}
