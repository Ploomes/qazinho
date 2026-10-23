import type { ICommandPicker, IComposerCommand } from '@/modules/Chat/types';
import type { IChatReference } from '@/shared/types';

/** `mentions` is what the @ being typed could point at; `mentionQuery` is null when the QA is not mentioning; `lockedText` says why nothing can be sent now; `referenceIds` are what a typed @ can point at; `isAnswering` turns send into stop; `isAutoFocused` puts the cursor in it as it shows; `command` is the command being put together, and `commandPicker` what it offers next. */
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
