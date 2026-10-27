import type {
  IDetectedAgent,
  IDeviceTools,
  IMachineCheck,
  IResourceSnapshot,
} from '@/shared/types';
import { NO_RESOURCES, NO_TOOLS } from './constants';

/**
 * The only caller of the machine side of the bridge. Views ask this, never
 * `window.qazinho`.
 */
export class Machine {
  public static async detectAgents(): Promise<IDetectedAgent[]> {
    return (await window.qazinho?.detectAgents()) ?? [];
  }

  public static async readResources(): Promise<IResourceSnapshot> {
    return (await window.qazinho?.readResources()) ?? NO_RESOURCES;
  }

  /** Looks again from scratch, for after the QA installed something. */
  public static async check(): Promise<IMachineCheck> {
    return (
      (await window.qazinho?.checkMachine()) ?? {
        agents: [],
        tools: NO_TOOLS,
        managers: {
          npm: { isFound: false, path: null },
          brew: { isFound: false, path: null },
        },
      }
    );
  }

  public static async detectDeviceTools(): Promise<IDeviceTools> {
    return (await window.qazinho?.detectDeviceTools()) ?? NO_TOOLS;
  }
}
