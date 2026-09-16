import type { TargetKind } from '@/types';

export interface ISidebarWorkspaceRow {
  kind: 'workspace';
  id: string;
  name: string;
  platform: TargetKind | null;
  meta: string;
  glyph: string;
  tone: string;
  animation: string;
  isSelected: boolean;
  isWaiting: boolean;
  isRemoving: boolean;
}
