import type { WorkspaceTab } from './WorkspaceTab';

/** A tab of the panel beside the chat. */
export type PanelTab = Exclude<WorkspaceTab, 'chat'>;
