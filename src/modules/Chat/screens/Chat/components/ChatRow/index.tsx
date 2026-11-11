import type { IChatRowProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { AgentMessage } from '@/modules/Chat/screens/Chat/components/AgentMessage';
import { AskNote } from '@/modules/Chat/screens/Chat/components/AskNote';
import { ErrorBlock } from '@/modules/Chat/screens/Chat/components/ErrorBlock';
import { FindingNote } from '@/modules/Chat/screens/Chat/components/FindingNote';
import { HandoffCard } from '@/modules/Chat/screens/Chat/components/HandoffCard';
import { MemoryNote } from '@/modules/Chat/screens/Chat/components/MemoryNote';
import { QuestionRound } from '@/modules/Chat/screens/Chat/components/QuestionRound';
import { SuggestionCard } from '@/modules/Chat/screens/Chat/components/SuggestionCard';
import { UserMessage } from '@/modules/Chat/screens/Chat/components/UserMessage';
import { VerdictNote } from '@/modules/Chat/screens/Chat/components/VerdictNote';
import { Icon, Intern } from '@/shared/components/atoms';
import { useChatRowViewModel } from './hooks';
import './styles.css';

/**
 * Uma mensagem no chat: a do QA num balão à direita, a do agente à esquerda com o rosto e
 * o nome dele, e a hora quando o mouse passa.
 */
export const ChatRow: React.FC<IChatRowProps> = (props) => {
  const {
    planTitle,
    className,
    hasHead,
    hasFace,
    who,
    whoClassName,
    isFromAgent,
    fromAgentTitle,
    initial,
    transition,
  } = useChatRowViewModel(props);
  const { message } = props;
  const { t } = useTranslation();

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      {hasHead && (
        <div className="chat-row__head">
          {hasFace && (
            <span className="chat-row__face" aria-hidden="true">
              <Intern mood="neutral" size={18} isStill isFigure />
            </span>
          )}
          <span className={whoClassName} title={fromAgentTitle}>
            {isFromAgent && (
              <span className="chat-row__from-agent" aria-label={fromAgentTitle}>
                <Icon name="sparkle" />
              </span>
            )}
            {who}
          </span>
          <span className="chat-row__at">{message.at}</span>
        </div>
      )}

      <div className="chat-row__body">
        {message.kind === 'user' && <UserMessage message={message} />}
        {(message.kind === 'agent' || message.kind === 'note') && (
          <AgentMessage text={message.text} />
        )}
        {message.kind === 'verdict' && <VerdictNote message={message} />}
        {message.kind === 'ask' && <AskNote message={message} />}
        {message.kind === 'memory' && <MemoryNote message={message} />}
        {message.kind === 'questions' && (
          <QuestionRound
            message={message}
            isAnswerable={props.isAnswerable}
            onAnswer={props.onAnswerQuestions}
            onVariables={props.onVariables}
          />
        )}
        {message.kind === 'error' && (
          <ErrorBlock
            message={message}
            onRetry={props.isRetryable === true ? props.onRetry : undefined}
          />
        )}
        {message.kind === 'finding' && (
          <FindingNote message={message} onOpenBug={props.onOpenBug} />
        )}
        {message.kind === 'suggestion' && (
          <SuggestionCard message={message} onTake={props.onTakeSuggestion} />
        )}
        {message.kind === 'plan' && (
          <HandoffCard
            title={planTitle}
            action={t('CHAT.PLAN_CARD_ACTION')}
            onOpen={props.onOpenPlan}
          />
        )}
      </div>
    </motion.div>
  );
};
