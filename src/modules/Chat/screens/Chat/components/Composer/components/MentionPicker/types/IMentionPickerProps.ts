import type { IChatReference } from '@/types';

export interface IMentionPickerProps {
  references: IChatReference[];
  highlighted: number;
  onPick: (id: string) => void;
  onHighlight: (index: number) => void;
}
