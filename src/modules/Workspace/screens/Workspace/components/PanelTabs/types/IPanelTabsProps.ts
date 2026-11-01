import type { PanelTab } from '@/modules/Workspace/types';

export interface IPanelTabsProps {
  current: PanelTab;
  planCount: number;
  runCount: number;
  bugCount: number;
  isLive: boolean;
  onSelect: (tab: PanelTab) => void;
}
