import type { IComposerAttachment } from './IComposerAttachment';
import type { ICommandPicker, IComposerCommand } from '@/modules/Chat/types';
import type { IChatReference } from '@/shared/types';

/**
 * O estado do composer: o @ sendo digitado, por que nada pode ser mandado, e o comando
 * sendo montado.
 */
export interface IComposerProps {
  value: string;
  lockedText: string | null;
  hint?: string | null;
  canAttachFiles?: boolean;
  isAnswering: boolean;
  isAutoFocused: boolean;
  mentions: IChatReference[];
  referenceIds: string[];
  mentionQuery: string | null;
  hasReferences: boolean;
  command: IComposerCommand | null;
  commandPicker: ICommandPicker | null;
  attachments: IComposerAttachment[];
  attachLabel: string;
  dropLabel: string;
  attachNotice: string;
  isAttaching: boolean;
  onChange: (value: string) => void;
  onAttach: () => void;
  onFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onSend: () => void;
  onStop: () => void;
  onPickMention: (id: string) => void;
  onPickCommand: (id: string) => void;
  onCommandBack: () => void;
  onCommandCancel: () => void;
}
