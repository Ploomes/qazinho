/**
 * Quão cheia está a janela de contexto do agente na conversa de um workspace, como o
 * agente relatou.
 */
export interface IAgentContext {
  tokens: number;
  window: number;
}
