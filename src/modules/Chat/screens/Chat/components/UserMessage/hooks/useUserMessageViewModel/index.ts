import type { IUserMessageProps } from '@/modules/Chat/screens/Chat/components/UserMessage/types';
import { splitMentions } from '@/modules/Chat/library';

export const useUserMessageViewModel = (props: IUserMessageProps) => {
  const { text, mentions = [] } = props.message;

  return {
    parts: splitMentions({ text, ids: mentions }).map((part, index) => ({
      ...part,
      key: `${String(index)}-${part.text}`,
    })),
  };
};
