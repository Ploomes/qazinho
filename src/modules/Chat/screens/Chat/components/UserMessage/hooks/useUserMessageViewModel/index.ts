import type { IUserMessageProps } from '@/modules/Chat/screens/Chat/components/UserMessage/types';
import { useTranslation } from 'react-i18next';
import { splitMentions } from '@/modules/Chat/library';
import { CHAT_COMMANDS } from '@/modules/Chat/screens/Chat/constants';

export const useUserMessageViewModel = (props: IUserMessageProps) => {
  const { text, mentions = [], command } = props.message;
  const { t } = useTranslation();
  const labelKey = CHAT_COMMANDS.find(({ id }) => id === command?.id)?.labelKey;

  return {
    hasText: text !== '',
    command:
      command === undefined || labelKey === undefined
        ? null
        : { name: t(labelKey), repository: command.repository, branch: command.branch },
    parts: splitMentions({ text, ids: mentions }).map((part, index) => ({
      ...part,
      key: `${String(index)}-${part.text}`,
    })),
  };
};
