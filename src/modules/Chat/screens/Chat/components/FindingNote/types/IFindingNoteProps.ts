import type { IFindingMessage } from '@/modules/Chat/types';

export interface IFindingNoteProps {
  message: IFindingMessage;
  onOpenBug: (bugId: string) => void;
}
