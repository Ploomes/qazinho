/** How full the agent's context window is in one workspace's conversation, as the agent reported it. */
export interface IAgentContext {
  tokens: number;
  window: number;
}
