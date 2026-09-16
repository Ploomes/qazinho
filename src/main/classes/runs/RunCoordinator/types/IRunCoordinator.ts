import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IRunEvent } from '@/types';

export interface IRunCoordinator {
  runner: AgentRunner;
  findCommand: (agentId: string) => Promise<string | null>;
  dataRoot: string;
  onEvent: (event: IRunEvent) => void;
}
