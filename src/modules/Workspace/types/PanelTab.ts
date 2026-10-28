import type { WorkspaceTab } from './WorkspaceTab';

/** Uma aba do painel ao lado do chat. */
export type PanelTab = Exclude<WorkspaceTab, 'chat'>;
