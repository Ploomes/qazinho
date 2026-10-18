import type { IChatRowProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { AgentMessage } from '@/modules/Chat/screens/Chat/components/AgentMessage';
import { AskBlock } from '@/modules/Chat/screens/Chat/components/AskBlock';
import { ErrorBlock } from '@/modules/Chat/screens/Chat/components/ErrorBlock';
import { HandoffCard } from '@/modules/Chat/screens/Chat/components/HandoffCard';
import { QuestionRound } from '@/modules/Chat/screens/Chat/components/QuestionRound';
import { UserMessage } from '@/modules/Chat/screens/Chat/components/UserMessage';
import { VerdictNote } from '@/modules/Chat/screens/Chat/components/VerdictNote';
import { useChatRowViewModel } from './hooks';
import './styles.css';

/** One message in the chat: who said it and when in the gutter, the message beside it. */
export const ChatRow: React.FC<IChatRowProps> = (props) => {
  const { who, whoClassName, initial, transition } = useChatRowViewModel(props);
  const { message } = props;
  const { t } = useTranslation();

  return (
    <motion.div
      className="chat-row"
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      <div className="chat-row__gutter">
        <span className={whoClassName}>{who}</span>
        <span className="chat-row__at">{message.at}</span>
      </div>

      <div className="chat-row__body">
        {message.kind === 'user' && <UserMessage message={message} />}
        {(message.kind === 'agent' || message.kind === 'note') && (
          <AgentMessage text={message.text} />
        )}
        {message.kind === 'verdict' && <VerdictNote message={message} />}
        {message.kind === 'ask' && (
          <AskBlock message={message} onAnswer={props.onAnswer} />
        )}
        {message.kind === 'questions' && (
          <QuestionRound
            message={message}
            isAnswerable={props.isAnswerable}
            onAnswer={props.onAnswerQuestions}
          />
        )}
        {message.kind === 'error' && <ErrorBlock message={message} />}
        {message.kind === 'plan' && (
          <HandoffCard
            isAccent
            glyph="▤"
            title={t('CHAT.PLAN_CARD_TITLE', {
              cases: message.caseCount,
              steps: message.stepCount,
            })}
            subtitle={t('CHAT.PLAN_CARD_SUBTITLE')}
            action={t('CHAT.PLAN_CARD_ACTION')}
            onOpen={props.onOpenPlan}
          />
        )}
      </div>
    </motion.div>
  );
};
