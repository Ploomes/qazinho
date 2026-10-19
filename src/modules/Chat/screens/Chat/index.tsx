import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Chip, Intern, Markdown } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { ChatRow, Composer, RunSection, TypingDots } from './components';
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
    draft,
    lockedText,
    suggestions,
    mentions,
    referenceIds,
    mentionQuery,
    hasReferences,
    onDraftChange,
    onPickMention,
    onSend,
    onStop,
    onSuggestion,
    onAnswer,
    onAnswerQuestions,
    onOpenPlan,
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
              <Chip
                key={suggestion.id}
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
        <div ref={listRef} className="chat__messages" onScroll={onScroll}>
          {items.map((item) =>
            item.kind === 'message' ? (
              <ChatRow
                key={item.key}
                message={item.message}
                isNew={item.isNew}
                isAnswerable={item.isAnswerable}
                onAnswer={onAnswer}
                onAnswerQuestions={onAnswerQuestions}
                onOpenPlan={onOpenPlan}
                onOpenBug={onOpenBug}
              />
            ) : (
              <RunSection
                key={item.key}
                at={item.at}
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
                    onAnswer={onAnswer}
                    onAnswerQuestions={onAnswerQuestions}
                    onOpenPlan={onOpenPlan}
                    onOpenBug={onOpenBug}
                  />
                ))}
              </RunSection>
            ),
          )}

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
        onChange={onDraftChange}
        onSend={onSend}
        onStop={onStop}
        onPickMention={onPickMention}
      />
    </div>
  );
};
