import type { IChatRowProps } from '@/modules/Chat/screens/Chat/components/ChatRow/types';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/shared/constants';

export const useChatRowViewModel = (props: IChatRowProps) => {
  const { message } = props;
  const { t } = useTranslation();

  const isAgent = message.kind === 'agent' || message.kind === 'note';
  const isFromAgent = message.kind === 'user' && message.from === 'agent';
  const side =
    message.kind === 'user'
      ? isFromAgent
        ? 'outside'
        : 'user'
      : isAgent
        ? 'agent'
        : 'card';

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
    className: [
      'chat-row',
      `chat-row--${side}`,
      ...(props.isNested === true ? ['chat-row--nested'] : []),
    ].join(' '),
    hasHead: side !== 'card' && props.isFollowUp !== true,
    hasFace: isAgent,
    who:
      message.kind === 'user'
        ? t(isFromAgent ? 'CHAT.YOUR_AGENT' : 'CHAT.YOU')
        : isAgent
          ? message.who
          : '',
    whoClassName:
      side === 'agent'
        ? 'chat-row__who chat-row__who--agent'
        : side === 'user'
          ? 'chat-row__who chat-row__who--unseen'
          : 'chat-row__who',
    isFromAgent,
    fromAgentTitle: isFromAgent ? t('CHAT.FROM_AGENT') : undefined,
    initial: props.isNew ? { opacity: 0, y: 10 } : false,
    transition: { duration: MOTION.durationSlow, ease: MOTION.ease },
  };
};
