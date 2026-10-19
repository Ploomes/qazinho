import type { IChatReference } from '@/shared/types';

/** `mentions` is what the @ being typed could point at; `mentionQuery` is null when the QA is not mentioning; `lockedText` says why nothing can be sent now; `referenceIds` are what a typed @ can point at. */
export interface IComposerProps {
  value: string;
  lockedText: string | null;
  mentions: IChatReference[];
  referenceIds: string[];
  mentionQuery: string | null;
  hasReferences: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onPickMention: (id: string) => void;
}
