import type { IDetectedAgent, IDeviceTools, IResourceSnapshot } from '@/types';
import { NO_RESOURCES, NO_TOOLS } from './constants';

/** The only caller of the machine side of the bridge. Views ask this, never `window.gocrash`. */
export class Machine {
  public static async detectAgents(): Promise<IDetectedAgent[]> {
    return (await window.gocrash?.detectAgents()) ?? [];
  }

  public static async readResources(): Promise<IResourceSnapshot> {
    return (await window.gocrash?.readResources()) ?? NO_RESOURCES;
  }

  public static async detectDeviceTools(): Promise<IDeviceTools> {
    return (await window.gocrash?.detectDeviceTools()) ?? NO_TOOLS;
  }
}
