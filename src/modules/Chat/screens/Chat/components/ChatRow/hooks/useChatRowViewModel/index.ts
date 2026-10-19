import type { IChatRowProps } from '@/modules/Chat/screens/Chat/components/ChatRow/types';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/shared/constants';

export const useChatRowViewModel = (props: IChatRowProps) => {
  const { message } = props;
  const { t } = useTranslation();

  const isAgent = message.kind === 'agent' || message.kind === 'note';

  return {
    planTitle:
      message.kind === 'plan'
        ? t('CHAT.PLAN_CARD_TITLE', {
            cases:
              message.caseCount === 1
                ? t('PLAN.CASES_ONE')
                : t('PLAN.CASES_OTHER', { count: message.caseCount }),
            steps:
              message.stepCount === 1
                ? t('PLAN.STEPS_ONE')
                : t('PLAN.STEPS_OTHER', { count: message.stepCount }),
          })
        : '',
    className: props.isNested === true ? 'chat-row chat-row--nested' : 'chat-row',
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
