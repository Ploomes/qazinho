import type { IMachineStore } from './types';
import { create } from 'zustand';

export const useMachineStore = create<IMachineStore>((set) => ({
  agents: [],
  resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
  tools: {
    androidSdk: { isFound: false, path: null },
    xcode: { isFound: false, path: null },
  },
  usage: null,
  hasDetected: false,

  setAgents: (agents) => set({ agents, hasDetected: true }),

  setResources: (resources) => set({ resources }),

  setTools: (tools) => set({ tools }),

  setUsage: (usage) => set({ usage }),
}));
