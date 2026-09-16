import type { IAgentEvent } from './IAgentEvent';
import type { IAgentTurn } from './IAgentTurn';
import type { IAskAgent } from './IAskAgent';
import type { IDetectedAgent } from './IDetectedAgent';
import type { IDeviceTools } from './IDeviceTools';
import type { IResourceSnapshot } from './IResourceSnapshot';
import type { IRunEvent } from './IRunEvent';
import type { ISavedState } from './ISavedState';
import type { ISavedWorkspace } from './ISavedWorkspace';
import type { IStartRun } from './IStartRun';
import type { PickKind } from './PickKind';
import type { Platform } from './Platform';

/** What the preload exposes to the page as `window.gocrash`. Data and purposeful functions only. */
export interface IGocrashApi {
  platform: Platform;
  detectAgents: () => Promise<IDetectedAgent[]>;
  readResources: () => Promise<IResourceSnapshot>;
  detectDeviceTools: () => Promise<IDeviceTools>;
  askAgent: (ask: IAskAgent) => Promise<IAgentTurn>;
  onAgentEvent: (listener: (event: IAgentEvent) => void) => () => void;
  startRun: (run: IStartRun) => Promise<void>;
  pauseRun: (props: { workspaceId: string; isPaused: boolean }) => Promise<void>;
  stopRun: (workspaceId: string) => Promise<void>;
  onRunEvent: (listener: (event: IRunEvent) => void) => () => void;
  readState: () => Promise<ISavedState>;
  saveProjects: (json: string) => Promise<void>;
  saveWorkspace: (saved: ISavedWorkspace) => Promise<void>;
  removeWorkspace: (workspaceId: string) => Promise<void>;
  readShot: (file: string) => Promise<string | null>;
  pickFile: (kind: PickKind) => Promise<string | null>;
}
