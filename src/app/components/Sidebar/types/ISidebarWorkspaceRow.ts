import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { TargetKind } from '@/shared/types';

export interface ISidebarWorkspaceRow {
  kind: 'workspace';
  id: string;
  name: string;
  platform: TargetKind | null;
  meta: string;
  icon: IconName;
  statusLabel: string;
  tone: string;
  animation: string;
  isSelected: boolean;
  isWaiting: boolean;
  isRemoving: boolean;
}
