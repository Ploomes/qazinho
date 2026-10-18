import type { IChatReference } from '@/shared/types';

/** `references` is what the active tab holds; each tab counts what it holds for the @ being typed. */
export interface IMentionPickerProps {
  references: IChatReference[];
  tabs: { kind: IChatReference['kind']; count: number; isActive: boolean }[];
  query: string;
  hasReferences: boolean;
  highlighted: number;
  onPick: (id: string) => void;
  onHighlight: (index: number) => void;
  onTab: (kind: IChatReference['kind']) => void;
}
