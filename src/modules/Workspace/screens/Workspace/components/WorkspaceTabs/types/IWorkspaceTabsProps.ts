import type { WorkspaceTab } from '@/modules/Workspace/types';

export interface IWorkspaceTabsProps {
  current: WorkspaceTab;
  planCount: number;
  runCount: number;
  bugCount: number;
  onSelect: (tab: WorkspaceTab) => void;
}
