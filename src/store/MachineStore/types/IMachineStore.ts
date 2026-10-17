import type {
  IAgentUsage,
  IDetectedAgent,
  IDeviceTools,
  IResourceSnapshot,
} from '@/shared/types';

/** What this machine actually has, and what QAzinho is costing it right now. */
export interface IMachineStore {
  agents: IDetectedAgent[];
  resources: IResourceSnapshot;
  tools: IDeviceTools;
  usage: IAgentUsage | null;
  hasDetected: boolean;
  setAgents: (agents: IDetectedAgent[]) => void;
  setResources: (resources: IResourceSnapshot) => void;
  setTools: (tools: IDeviceTools) => void;
  setUsage: (usage: IAgentUsage) => void;
}
