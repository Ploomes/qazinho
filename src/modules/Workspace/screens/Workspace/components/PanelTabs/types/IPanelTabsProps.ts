import type { PanelTab } from '@/modules/Workspace/types';

export interface IPanelTabsProps {
  current: PanelTab;
  bugCount: number;
  isLive: boolean;
  onSelect: (tab: PanelTab) => void;
}
