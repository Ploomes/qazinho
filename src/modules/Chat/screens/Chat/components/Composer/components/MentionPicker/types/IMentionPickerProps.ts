import type { IChatReference } from '@/shared/types';

/**
 * `references` é o que a aba ativa guarda; cada aba conta o que guarda para o @ sendo
 * digitado.
 */
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
