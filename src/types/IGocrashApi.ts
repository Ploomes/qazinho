import type { IAgentEvent } from './IAgentEvent';
import type { IAgentTurn } from './IAgentTurn';
import type { IAskAgent } from './IAskAgent';
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
  askAgent: (ask: IAskAgent) => Promise<IAgentTurn>;
  onAgentEvent: (listener: (event: IAgentEvent) => void) => () => void;
}
