import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { AskCard } from '@/modules/Run';
import { Button, Chip, Icon, Intern, Markdown } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import {
  AgentLine,
  ChatRow,
  Composer,
  RunActivity,
  RunProgress,
  RunSection,
  TypingDots,
} from './components';
import { useChatViewModel } from './hooks';
import './styles.css';

export const Chat: React.FC = () => {
  const {
    chatStyle,
    items,
    listRef,
    onScroll,
    isEmpty,
    isRunStage,
    isAgentTyping,
    liveText,
    liveWho,
    activity,
    retryText,
    readStatus,
    lookStatus,
    draft,
    lockedText,
    composerHint,
    canAttachFiles,
    talkStatus,
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
    isComposerFocused,
    secretWarning,
    secretRemoveLabel,
    secretSendLabel,
    onRemoveSecret,
    onSendSecret,
    onPickMention,
    attachments,
    attachLabel,
    dropLabel,
    attachNotice,
    isAttaching,
    onAttach,
    onFiles,
    onRemoveAttachment,
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
    onRetry,
    onOpenBugs,
  } = useChatViewModel();
  const { t } = useTranslation();

  return (
    <div className="chat" style={chatStyle}>
      {isEmpty ? (
        <div className="chat__empty">
          <Intern mood="neutral" size={112} />
          <span className="chat__empty-title">{t('CHAT.EMPTY_TITLE')}</span>
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
          {isRunStage && <RunProgress />}
          {!isRunStage &&
            items.map((item) =>
              item.kind === 'message' ? (
                <ChatRow
                  key={item.key}
                  message={item.message}
                  isNew={item.isNew}
                  isFollowUp={item.isFollowUp}
                  isAnswerable={item.isAnswerable}
                  isRetryable={item.isRetryable}
                  onRetry={onRetry}
                  onAnswerQuestions={onAnswerQuestions}
                  onOpenPlan={onOpenPlan}
                  onTakeSuggestion={onTakeSuggestion}
                  onVariables={onVariables}
                  onOpenBug={onOpenBug}
                />
              ) : (
                <RunSection
                  key={item.key}
                  title={item.title}
                  facts={item.facts}
                  isLive={item.isLive}
                  isExpanded={item.isExpanded}
                  isExpandable={item.isExpandable}
                  openLabel={item.openLabel}
                  activity={item.activity}
                  onToggle={() => {
                    onToggleRun(item.runId);
                  }}
                  onOpen={() => {
                    onOpenRun(item.runId);
                  }}
                >
                  {item.bugs !== null && (
                    <button type="button" className="chat__run-bugs" onClick={onOpenBugs}>
                      {item.bugs}
                      <Icon name="arrow" />
                    </button>
                  )}
                  {item.rows.map((row) => (
                    <ChatRow
                      key={row.key}
                      message={row.message}
                      isNew={row.isNew}
                      isFollowUp={row.isFollowUp}
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

          <AnimatePresence initial={false}>
            {talkStatus !== '' && (
              <motion.div
                key="talk"
                className="chat__row"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
              >
                <div className="chat__face">
                  <Intern mood="thinking" size={40} />
                </div>
                <div className="chat__body chat__live" role="status">
                  <p className="chat__talk">{talkStatus}</p>
                  <TypingDots />
                </div>
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
              {liveText === '' ? (
                <div className="chat__face">
                  <Intern mood="thinking" size={40} />
                </div>
              ) : (
                <div className="chat__head">
                  <span className="chat__head-face" aria-hidden="true">
                    <Intern mood="neutral" size={22} isStill isFigure />
                  </span>
                  <span className="chat__live-who">{liveWho}</span>
                </div>
              )}
              <div className="chat__body chat__live">
                {liveText !== '' && <Markdown isStreaming>{liveText}</Markdown>}
                <TypingDots />
                {activity.length > 0 && <RunActivity lines={activity} />}
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

      <AnimatePresence initial={false}>
        {secretWarning !== '' && (
          <motion.div
            key="secret"
            className="chat__secret"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="chat__secret-body">
              <span className="chat__secret-text">
                <span className="chat__secret-icon">
                  <Icon name="attention" />
                </span>
                {secretWarning}
              </span>
              <span className="chat__secret-actions">
                <Button size="sm" variant="secondary" onClick={onRemoveSecret}>
                  {secretRemoveLabel}
                </Button>
                <Button size="sm" variant="ghost" onClick={onSendSecret}>
                  {secretSendLabel}
                </Button>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Composer
        accessory={<AgentLine />}
        value={draft}
        lockedText={lockedText}
        hint={composerHint}
        canAttachFiles={canAttachFiles}
        isAnswering={isAgentTyping}
        isAutoFocused={isComposerFocused}
        mentions={mentions}
        referenceIds={referenceIds}
        mentionQuery={mentionQuery}
        hasReferences={hasReferences}
        command={command}
        commandPicker={commandPicker}
        attachments={attachments}
        attachLabel={attachLabel}
        dropLabel={dropLabel}
        attachNotice={attachNotice}
        isAttaching={isAttaching}
        onChange={onDraftChange}
        onAttach={onAttach}
        onFiles={onFiles}
        onRemoveAttachment={onRemoveAttachment}
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
