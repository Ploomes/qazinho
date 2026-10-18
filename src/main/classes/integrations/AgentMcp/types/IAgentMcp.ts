/** What AgentMcp needs: where each agent CLI is, how to open a URL and a script in Terminal, and a folder of its own. */
export interface IAgentMcp {
  findAgent: (agentId: string) => Promise<string | null>;
  openUrl: (url: string) => Promise<void>;
  openScript: (file: string) => Promise<void>;
  folder: string;
}
