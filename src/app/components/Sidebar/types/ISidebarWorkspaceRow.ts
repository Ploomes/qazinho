import type { ISidebarSignal } from './ISidebarSignal';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type { TargetKind } from '@/shared/types';

export interface ISidebarWorkspaceRow {
  kind: 'workspace';
  id: string;
  name: string;
  platform: TargetKind | null;
  meta: string;
  subtitle: string;
  icon: IconName;
  statusLabel: string;
  tone: string;
  animation: string;
  signal: ISidebarSignal | null;
  label: string;
  isSelected: boolean;
  isRemoving: boolean;
}
