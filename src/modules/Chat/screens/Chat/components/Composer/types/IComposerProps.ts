import type { IChatReference } from '@/shared/types';

/** `mentions` is what the @ being typed could point at, empty when the QA is not mentioning. */
export interface IComposerProps {
  value: string;
  agentLabel: string;
  mentions: IChatReference[];
  onChange: (value: string) => void;
  onSend: () => void;
  onPickMention: (id: string) => void;
}
