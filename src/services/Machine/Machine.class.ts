import type {
  IDetectedAgent,
  IDeviceTools,
  IMachineCheck,
  IResourceSnapshot,
} from '@/shared/types';
import { NO_RESOURCES, NO_TOOLS } from './constants';

/**
 * O único que chama o lado da máquina da bridge. As views perguntam a ele, nunca ao
 * `window.qazinho`.
 */
export class Machine {
  public static async detectAgents(): Promise<IDetectedAgent[]> {
    return (await window.qazinho?.detectAgents()) ?? [];
  }

  public static async readResources(): Promise<IResourceSnapshot> {
    return (await window.qazinho?.readResources()) ?? NO_RESOURCES;
  }

  /** Olha de novo do zero, para depois que o QA instalou algo. */
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
