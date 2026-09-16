export interface ISidebarWorkspaceRow {
  kind: 'workspace';
  id: string;
  name: string;
  meta: string;
  glyph: string;
  tone: string;
  animation: string;
  isSelected: boolean;
  isWaiting: boolean;
  isRemoving: boolean;
}
