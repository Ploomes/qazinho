import type { ISuggestionMessage } from '@/modules/Chat/types';

export interface ISuggestionCardProps {
  message: ISuggestionMessage;
  onTake: (messageId: string) => void;
}
