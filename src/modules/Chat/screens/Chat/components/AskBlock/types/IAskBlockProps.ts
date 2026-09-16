import type { IAskMessage } from '@/modules/Chat/types';

export interface IAskBlockProps {
  message: IAskMessage;
  onAnswer: (reply: string) => void;
}
