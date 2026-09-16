import type { IDetectedAgent } from './IDetectedAgent';
import type { IDeviceTools } from './IDeviceTools';
import type { IResourceSnapshot } from './IResourceSnapshot';
import type { Platform } from './Platform';

/** What the preload exposes to the page as `window.gocrash`. Data and purposeful functions only. */
export interface IGocrashApi {
  platform: Platform;
  detectAgents: () => Promise<IDetectedAgent[]>;
  readResources: () => Promise<IResourceSnapshot>;
  detectDeviceTools: () => Promise<IDeviceTools>;
}
