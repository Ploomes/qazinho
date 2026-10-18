import type { IChatReference } from '@/shared/types';

export interface IMentionPickerProps {
  references: IChatReference[];
  query: string;
  hasReferences: boolean;
  highlighted: number;
  onPick: (id: string) => void;
  onHighlight: (index: number) => void;
}
