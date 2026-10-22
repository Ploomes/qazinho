import type { IVideoRecorder } from './IVideoRecorder';
import type { Harness, McpHost } from '@/harness';
import type { AgentRunner } from '@/main/classes/agents/AgentRunner';
import type { LiveStream } from '@/main/classes/devices/LiveStream';
import type { IVariableValue, ShrinkImage } from '@/main/types';
import type { IAndroidSetup, IIosSetup, IRunEvent } from '@/shared/types';

export interface IRunCoordinator {
  runner: AgentRunner;
  findCommand: (agentId: string) => Promise<string | null>;
  findAndroid: () => Promise<IAndroidSetup | null>;
  findIos: () => Promise<IIosSetup | null>;
  dataRoot: string;
  live: LiveStream;
  tools: McpHost;
  harness: Harness;
  onEvent: (event: IRunEvent) => void;
  shrink?: ShrinkImage;
  recorder?: IVideoRecorder;
  variablesOf?: (projectId: string) => Promise<IVariableValue[]>;
  keepVariable?: (props: {
    projectId: string;
    variable: IVariableValue;
  }) => Promise<boolean>;
  askWaitMs?: number;
}
