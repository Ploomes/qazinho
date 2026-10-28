import type { IAppSnapshot } from './IAppSnapshot';

/**
 * O que a página pergunta ao assistente: as próprias palavras do QA, na sessão que ele já
 * tem, com o QAzinho como está agora.
 */
export interface IAssistantAsk {
  agentId: string;
  model: string;
  sessionId: string | null;
  text: string;
  app: IAppSnapshot;
}
