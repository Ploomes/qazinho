import type { IChatReference } from '@/shared/types';

/** `mentions` is what the @ being typed could point at; `mentionQuery` is null when the QA is not mentioning; `lockedText` says why nothing can be sent now; `referenceIds` are what a typed @ can point at; `isAnswering` turns send into stop. */
export interface IComposerProps {
  value: string;
  lockedText: string | null;
  isAnswering: boolean;
  mentions: IChatReference[];
  referenceIds: string[];
  mentionQuery: string | null;
  hasReferences: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onPickMention: (id: string) => void;
}
