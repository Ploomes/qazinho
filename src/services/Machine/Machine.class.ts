import type { IDetectedAgent, IDeviceTools, IResourceSnapshot } from '@/types';

const NO_TOOLS: IDeviceTools = {
  androidSdk: { isFound: false, path: null },
  xcode: { isFound: false, path: null },
};

const EMPTY: IResourceSnapshot = { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] };

/** The only caller of the machine side of the bridge. Views ask this, never `window.gocrash`. */
export class Machine {
  public static async detectAgents(): Promise<IDetectedAgent[]> {
    return (await window.gocrash?.detectAgents()) ?? [];
  }

  public static async readResources(): Promise<IResourceSnapshot> {
    return (await window.gocrash?.readResources()) ?? EMPTY;
  }

  public static async detectDeviceTools(): Promise<IDeviceTools> {
    return (await window.gocrash?.detectDeviceTools()) ?? NO_TOOLS;
  }
}
