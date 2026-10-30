import type { ISuggestionMessage } from '@/modules/Chat/types';

export interface ISuggestionCardProps {
  message: ISuggestionMessage;
  onTake: (props: { messageId: string; only: number[] }) => void;
}
