import type { IAgentLimits } from './IAgentLimits';

/**
 * O que o agente relatou. Uma janela que ele nunca mencionou é null, que não é o mesmo
 * que zero.
 */
export interface IAgentUsage extends IAgentLimits {
  contextTokens: number;
  contextWindow: number;
}
