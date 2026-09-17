import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { DeviceToolServer } from '@/main/classes/agents/DeviceToolServer';
import type { Harness } from '@/main/classes/agents/Harness';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IAndroidSetup, IIosSetup, IRunEvent } from '@/types';

export interface IRunCoordinator {
  runner: AgentRunner;
  findCommand: (agentId: string) => Promise<string | null>;
  findAndroid: () => Promise<IAndroidSetup | null>;
  findIos: () => Promise<IIosSetup | null>;
  dataRoot: string;
  live: LiveStream;
  tools: DeviceToolServer;
  harness: Harness;
  onEvent: (event: IRunEvent) => void;
}
