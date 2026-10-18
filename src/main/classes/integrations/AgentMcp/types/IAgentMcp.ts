/** What AgentMcp needs: where Claude Code is, and a folder of QAzinho's own to open it in. */
export interface IAgentMcp {
  findClaude: () => Promise<string | null>;
  folder: string;
}
