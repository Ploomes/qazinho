import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IAndroidSetup, IIosSetup, IRunEvent } from '@/types';

export interface IRunCoordinator {
  runner: AgentRunner;
  findCommand: (agentId: string) => Promise<string | null>;
  findAndroid: () => Promise<IAndroidSetup | null>;
  findIos: () => Promise<IIosSetup | null>;
  dataRoot: string;
  live: LiveStream;
  onEvent: (event: IRunEvent) => void;
}
