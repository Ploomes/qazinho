import type { ICommandPicker, IComposerCommand } from '@/modules/Chat/types';
import type { IChatReference } from '@/shared/types';

/**
 * O estado do composer: o @ sendo digitado, por que nada pode ser mandado, e o comando
 * sendo montado.
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
