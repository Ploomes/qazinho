import type { TargetKind } from '@/shared/types';

export interface ISidebarWorkspaceRow {
  kind: 'workspace';
  id: string;
  name: string;
  platform: TargetKind | null;
  meta: string;
  glyph: string;
  statusLabel: string;
  tone: string;
  animation: string;
  isSelected: boolean;
  isWaiting: boolean;
  isRemoving: boolean;
}
