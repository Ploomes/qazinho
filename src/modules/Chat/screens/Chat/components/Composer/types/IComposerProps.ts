import type { ICommandPicker, IComposerCommand } from '@/modules/Chat/types';
import type { IChatReference } from '@/shared/types';

/**
 * The composer's state: the @ being typed, why nothing can be sent, and the command being
 * built.
 */
export interface IComposerProps {
  value: string;
  lockedText: string | null;
  isAnswering: boolean;
  isAutoFocused: boolean;
  mentions: IChatReference[];
  referenceIds: string[];
  mentionQuery: string | null;
  hasReferences: boolean;
  command: IComposerCommand | null;
  commandPicker: ICommandPicker | null;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onPickMention: (id: string) => void;
  onPickCommand: (id: string) => void;
  onCommandBack: () => void;
  onCommandCancel: () => void;
}
