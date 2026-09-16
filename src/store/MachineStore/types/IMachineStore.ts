import type { IDetectedAgent, IDeviceTools, IResourceSnapshot } from '@/types';

/** What this machine actually has, and what gocrash is costing it right now. */
export interface IMachineStore {
  agents: IDetectedAgent[];
  resources: IResourceSnapshot;
  tools: IDeviceTools;
  hasDetected: boolean;
  setAgents: (agents: IDetectedAgent[]) => void;
  setResources: (resources: IResourceSnapshot) => void;
  setTools: (tools: IDeviceTools) => void;
}
