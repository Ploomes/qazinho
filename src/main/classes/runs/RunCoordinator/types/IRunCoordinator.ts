import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IAndroidSetup, IRunEvent } from '@/types';

export interface IRunCoordinator {
  runner: AgentRunner;
  findCommand: (agentId: string) => Promise<string | null>;
  findAndroid: () => Promise<IAndroidSetup | null>;
  dataRoot: string;
  onEvent: (event: IRunEvent) => void;
}
