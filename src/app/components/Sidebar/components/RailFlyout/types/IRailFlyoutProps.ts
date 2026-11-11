import type { ISidebarFlyout } from '@/app/components/Sidebar/types';

/** O painel de um projeto ao lado da barra recolhida, e o que cada linha faz. */
export interface IRailFlyoutProps {
  flyout: ISidebarFlyout;
  markSize: number;
  newLabel: string;
  settingsLabel: string;
  onKeep: () => void;
  onLeave: () => void;
  onPlan: (workspaceId: string) => void;
  onNew: (projectId: string) => void;
  onSettings: (projectId: string) => void;
}
