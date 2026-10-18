import type { IChatRowProps } from '@/modules/Chat/screens/Chat/components/ChatRow/types';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/shared/constants';

export const useChatRowViewModel = (props: IChatRowProps) => {
  const { message } = props;
  const { t } = useTranslation();

  const isAgent = message.kind === 'agent' || message.kind === 'note';

  return {
    who:
      message.kind === 'user'
        ? t('CHAT.YOU')
        : message.kind === 'agent' || message.kind === 'note'
          ? message.who
          : '',
    whoClassName: isAgent ? 'chat-row__who chat-row__who--agent' : 'chat-row__who',
    initial: props.isNew ? { opacity: 0, y: 10 } : false,
    transition: { duration: MOTION.durationSlow, ease: MOTION.ease },
  };
};
