import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { IRunEvent } from '@/types';

export interface IRunCoordinator {
  runner: AgentRunner;
  onEvent: (event: IRunEvent) => void;
}
