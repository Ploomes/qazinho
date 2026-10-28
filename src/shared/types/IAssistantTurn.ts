import type { ChatFailure } from './ChatFailure';
import type { IAgentTurn } from './IAgentTurn';

/** Um turno do assistente: o que o agente disse, e por que falhou quando falhou. */
export interface IAssistantTurn extends IAgentTurn {
  failure: ChatFailure | null;
}
