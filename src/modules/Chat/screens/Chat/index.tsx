import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Chip, Intern } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import {
  AgentMessage,
  AskBlock,
  Composer,
  ErrorBlock,
  HandoffCard,
  TypingDots,
  UserMessage,
  VerdictNote,
} from './components';
import { useChatViewModel } from './hooks';
import './styles.css';

export const Chat: React.FC = () => {
  const {
    messages,
    listRef,
    onScroll,
    isEmpty,
    isAgentTyping,
    liveText,
    draft,
    suggestions,
    agentLabel,
    mentions,
    onDraftChange,
    onPickMention,
    onSend,
    onSuggestion,
    onAnswer,
    onOpenPlan,
    onOpenRuns,
  } = useChatViewModel();
  const { t } = useTranslation();

  return (
    <div className="chat">
      {isEmpty ? (
        <div className="chat__empty">
          <Intern mood="neutral" />
          <span className="chat__empty-title">{t('CHAT.EMPTY_TITLE')}</span>
          <p className="chat__empty-body">{t('CHAT.EMPTY_BODY')}</p>
          <div className="chat__suggestions">
            {suggestions.map((suggestion) => (
              <Chip
                key={suggestion.labelKey}
                onClick={() => {
                  onSuggestion(suggestion.text);
                }}
              >
                {t(suggestion.labelKey)}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div ref={listRef} className="chat__messages" onScroll={onScroll}>
          {messages.map(({ message, isNew }) => (
            <motion.div
              key={message.id}
              className="chat__row"
              initial={isNew ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
            >
              <div className="chat__gutter">
                <span
                  className={
                    message.kind === 'agent' ? 'chat__who chat__who--agent' : 'chat__who'
                  }
                >
                  {message.kind === 'user'
                    ? t('CHAT.YOU')
                    : message.kind === 'agent'
                      ? message.who
                      : ''}
                </span>
                <span className="chat__at">{message.at}</span>
              </div>

              <div className="chat__body">
                {message.kind === 'user' && <UserMessage message={message} />}
                {message.kind === 'agent' && <AgentMessage message={message} />}
                {message.kind === 'verdict' && <VerdictNote message={message} />}
                {message.kind === 'ask' && (
                  <AskBlock message={message} onAnswer={onAnswer} />
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
                    onOpen={onOpenPlan}
                  />
                )}
                {message.kind === 'run' && (
                  <HandoffCard
                    glyph="↻"
                    title={t('CHAT.RUN_CARD_TITLE', {
                      id: message.runId,
                      passed: message.passed,
                      failed: message.failed,
                    })}
                    subtitle={t('CHAT.RUN_CARD_SUBTITLE')}
                    action={t('CHAT.RUN_CARD_ACTION')}
                    onOpen={onOpenRuns}
                  />
                )}
              </div>
            </motion.div>
          ))}

          {isAgentTyping && (
            <div className="chat__row">
              <div className="chat__gutter chat__gutter--intern">
                <Intern mood="thinking" size={40} />
              </div>
              <div className="chat__live">
                {liveText !== '' && <p className="chat__live-text">{liveText}</p>}
                <TypingDots />
              </div>
            </div>
          )}
        </div>
      )}

      <Composer
        value={draft}
        agentLabel={agentLabel}
        mentions={mentions}
        onChange={onDraftChange}
        onSend={onSend}
        onPickMention={onPickMention}
      />
    </div>
  );
};
