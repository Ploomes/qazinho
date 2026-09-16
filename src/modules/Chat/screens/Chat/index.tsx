import { motion } from 'motion/react';
import { Chip, Logo } from '@/components/atoms';
import { MOTION } from '@/constants';
import {
  ActionLog,
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
    isEmpty,
    isAgentTyping,
    draft,
    suggestions,
    targetLabel,
    agentLabel,
    onDraftChange,
    onSend,
    onSuggestion,
    onAnswer,
    onOpenPlan,
    onOpenRuns,
  } = useChatViewModel();

  return (
    <div className="chat">
      {isEmpty ? (
        <div className="chat__empty">
          <Logo size={42} />
          <span className="chat__empty-title">Nothing has crashed here yet.</span>
          <p className="chat__empty-body">
            Say what you want covered. The agent writes the cases, you fix what it got
            wrong.
          </p>
          <div className="chat__suggestions">
            {suggestions.map((suggestion) => (
              <Chip
                key={suggestion.label}
                onClick={() => {
                  onSuggestion(suggestion.text);
                }}
              >
                {suggestion.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat__messages">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              className="chat__row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: MOTION.durationSlow,
                ease: MOTION.ease,
                delay: Math.min(index * MOTION.stagger, MOTION.maxStagger),
              }}
            >
              <div className="chat__gutter">
                <span
                  className={
                    message.kind === 'agent' ? 'chat__who chat__who--agent' : 'chat__who'
                  }
                >
                  {message.kind === 'user'
                    ? 'You'
                    : message.kind === 'agent'
                      ? 'Claude'
                      : ''}
                </span>
                <span className="chat__at">{message.at}</span>
              </div>

              <div className="chat__body">
                {message.kind === 'user' && <UserMessage message={message} />}
                {message.kind === 'agent' && <AgentMessage message={message} />}
                {message.kind === 'action' && <ActionLog message={message} />}
                {message.kind === 'verdict' && <VerdictNote message={message} />}
                {message.kind === 'ask' && (
                  <AskBlock message={message} onAnswer={onAnswer} />
                )}
                {message.kind === 'error' && <ErrorBlock message={message} />}
                {message.kind === 'plan' && (
                  <HandoffCard
                    isAccent
                    glyph="▤"
                    title={`Plan · ${String(message.caseCount)} cases · ${String(message.stepCount)} steps`}
                    subtitle="Read it, change what is wrong, then run it."
                    action="Open in Plan →"
                    onOpen={onOpenPlan}
                  />
                )}
                {message.kind === 'run' && (
                  <HandoffCard
                    glyph="↻"
                    title={`Run ${message.runId} · ${String(message.passed)} passed · ${String(message.failed)} failed`}
                    subtitle="Counters, screenshots and the expected vs. got for every failure."
                    action="Open in Runs →"
                    onOpen={onOpenRuns}
                  />
                )}
              </div>
            </motion.div>
          ))}

          {isAgentTyping && (
            <div className="chat__row">
              <div className="chat__gutter" />
              <TypingDots />
            </div>
          )}
        </div>
      )}

      <Composer
        value={draft}
        targetLabel={targetLabel}
        agentLabel={agentLabel}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </div>
  );
};
