import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Chip, Intern, Markdown } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import { AskCard, ChatRow, Composer, RunSection, TypingDots } from './components';
import { useChatViewModel } from './hooks';
import './styles.css';

export const Chat: React.FC = () => {
  const {
    chatStyle,
    items,
    listRef,
    onScroll,
    isEmpty,
    isAgentTyping,
    liveText,
    retryText,
    readStatus,
    lookStatus,
    draft,
    lockedText,
    suggestions,
    mentions,
    referenceIds,
    mentionQuery,
    hasReferences,
    command,
    commandPicker,
    onPickCommand,
    onCommandBack,
    onCommandCancel,
    onDraftChange,
    onPickMention,
    onSend,
    onStop,
    question,
    onAnswerQuestion,
    onAnswerQuestions,
    onOpenPlan,
    onTakeSuggestion,
    onVariables,
    onToggleRun,
    onOpenRun,
    onOpenBug,
  } = useChatViewModel();
  const { t } = useTranslation();

  return (
    <div className="chat" style={chatStyle}>
      {isEmpty ? (
        <div className="chat__empty">
          <Intern mood="neutral" size={112} />
          <span className="chat__empty-title">{t('CHAT.EMPTY_TITLE')}</span>
          <p className="chat__empty-body">{t('CHAT.EMPTY_BODY')}</p>
          <div className="chat__suggestions">
            {suggestions.map((suggestion) => (
              <Chip key={suggestion.id} onClick={suggestion.onClick}>
                {suggestion.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : (
        <div ref={listRef} className="chat__messages" onScroll={onScroll}>
          {items.map((item) =>
            item.kind === 'message' ? (
              <ChatRow
                key={item.key}
                message={item.message}
                isNew={item.isNew}
                isAnswerable={item.isAnswerable}
                onAnswerQuestions={onAnswerQuestions}
                onOpenPlan={onOpenPlan}
                onTakeSuggestion={onTakeSuggestion}
                onVariables={onVariables}
                onOpenBug={onOpenBug}
              />
            ) : (
              <RunSection
                key={item.key}
                at={item.at}
                day={item.day}
                title={item.title}
                facts={item.facts}
                countLabel={item.countLabel}
                isLive={item.isLive}
                isExpanded={item.isExpanded}
                isExpandable={item.isExpandable}
                openLabel={item.openLabel}
                onToggle={() => {
                  onToggleRun(item.runId);
                }}
                onOpen={() => {
                  onOpenRun(item.runId);
                }}
              >
                {item.rows.map((row) => (
                  <ChatRow
                    key={row.key}
                    message={row.message}
                    isNew={row.isNew}
                    isAnswerable={false}
                    isNested
                    onAnswerQuestions={onAnswerQuestions}
                    onOpenPlan={onOpenPlan}
                    onTakeSuggestion={onTakeSuggestion}
                    onVariables={onVariables}
                    onOpenBug={onOpenBug}
                  />
                ))}
              </RunSection>
            ),
          )}

          <AnimatePresence>
            {question !== null && (
              <motion.div
                key={question.key}
                className="chat__ask"
                initial={STICKER.panel.initial}
                animate={STICKER.panel.animate}
                exit={STICKER.panel.exit}
              >
                <AskCard question={question.live} onAnswer={onAnswerQuestion} />
              </motion.div>
            )}
          </AnimatePresence>

          {isAgentTyping && (
            <motion.div
              className="chat__row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
            >
              <div className="chat__gutter chat__gutter--intern">
                <Intern mood="thinking" size={40} />
              </div>
              <div className="chat__body chat__live">
                {liveText !== '' && <Markdown isRevealing>{liveText}</Markdown>}
                <TypingDots />
                <AnimatePresence initial={false}>
                  {lookStatus !== '' && (
                    <motion.div
                      key="look"
                      className="chat__retry"
                      role="status"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                    >
                      <p className="chat__retry-text">{lookStatus}</p>
                    </motion.div>
                  )}
                  {readStatus !== '' && (
                    <motion.div
                      key="code"
                      className="chat__retry"
                      role="status"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                    >
                      <p className="chat__retry-text chat__code-text">{readStatus}</p>
                    </motion.div>
                  )}
                  {retryText !== '' && (
                    <motion.div
                      key="retry"
                      className="chat__retry"
                      role="status"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                    >
                      <p className="chat__retry-text">{retryText}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <Composer
        value={draft}
        lockedText={lockedText}
        isAnswering={isAgentTyping}
        mentions={mentions}
        referenceIds={referenceIds}
        mentionQuery={mentionQuery}
        hasReferences={hasReferences}
        command={command}
        commandPicker={commandPicker}
        onChange={onDraftChange}
        onSend={onSend}
        onStop={onStop}
        onPickMention={onPickMention}
        onPickCommand={onPickCommand}
        onCommandBack={onCommandBack}
        onCommandCancel={onCommandCancel}
      />
    </div>
  );
};
