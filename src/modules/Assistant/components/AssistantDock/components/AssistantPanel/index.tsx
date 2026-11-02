import { AnimatePresence, motion } from 'motion/react';
import { BuildProgress } from '@/modules/Build';
import {
  Button,
  Chip,
  Icon,
  IconButton,
  Intern,
  Markdown,
} from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import { ConfirmCard } from './components';
import { useAssistantPanelViewModel } from './hooks';
import './styles.css';

/**
 * O chatzinho do Estagiário: quem ele é e o que está fazendo, o que foi dito e feito, e o
 * campo para perguntar a ele.
 */
export const AssistantPanel: React.FC = () => {
  const {
    listRef,
    inputRef,
    title,
    status,
    mood,
    isStill,
    headerIntern,
    emptyIntern,
    closeLabel,
    startOverLabel,
    canStartOver,
    isEmpty,
    emptyTitle,
    emptyBody,
    suggestions,
    rows,
    isTyping,
    liveText,
    draft,
    secretWarning,
    secretRemoveLabel,
    secretSendLabel,
    onRemoveSecret,
    onSendSecret,
    placeholder,
    sendLabel,
    stopLabel,
    canSend,
    isAsking,
    onDraft,
    onSend,
    onStop,
    onStartOver,
    onClose,
    onInputKeyDown,
    onPanelKeyDown,
  } = useAssistantPanelViewModel();

  return (
    <motion.section
      className="assistant-panel"
      role="dialog"
      aria-label={title}
      initial={STICKER.pop.initial}
      animate={STICKER.pop.animate}
      exit={STICKER.pop.exit}
      onKeyDown={onPanelKeyDown}
    >
      <header className="assistant-panel__header">
        <Intern mood={mood} size={headerIntern} isStill={isStill} />
        <span className="assistant-panel__heading">
          <span className="assistant-panel__title">{title}</span>
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={status}
              className="assistant-panel__status"
              aria-live="polite"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              {status}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="assistant-panel__actions">
          <AnimatePresence initial={false}>
            {canStartOver && (
              <motion.span
                key="start-over"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                <IconButton
                  icon="replay"
                  label={startOverLabel}
                  size="sm"
                  onClick={onStartOver}
                />
              </motion.span>
            )}
          </AnimatePresence>
          <IconButton icon="close" label={closeLabel} size="sm" onClick={onClose} />
        </span>
      </header>

      <div ref={listRef} className="assistant-panel__list">
        <AnimatePresence initial={false} mode="popLayout">
          {isEmpty && (
            <motion.div
              key="empty"
              className="assistant-panel__empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              <Intern mood="neutral" size={emptyIntern} />
              <span className="assistant-panel__empty-title">{emptyTitle}</span>
              <span className="assistant-panel__empty-body">{emptyBody}</span>
              <span className="assistant-panel__suggestions">
                {suggestions.map((suggestion) => (
                  <Chip key={suggestion.id} onClick={suggestion.onClick}>
                    {suggestion.label}
                  </Chip>
                ))}
              </span>
            </motion.div>
          )}

          {rows.map((row) => (
            <motion.div
              key={row.key}
              className="assistant-panel__row"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              {row.kind === 'user' && <p className={row.className}>{row.text}</p>}
              {row.kind === 'agent' && <Markdown>{row.text}</Markdown>}
              {row.kind === 'tool' && (
                <span className={row.className}>
                  <span className="assistant-panel__tool-icon">
                    {row.icon !== null && <Icon name={row.icon} />}
                  </span>
                  <span className="assistant-panel__tool-text">{row.text}</span>
                  {row.failed !== '' && (
                    <span className="assistant-panel__tool-failed">· {row.failed}</span>
                  )}
                </span>
              )}
              {row.kind === 'tool' && row.buildId !== null && (
                <span className="assistant-panel__build">
                  <BuildProgress buildId={row.buildId} />
                </span>
              )}
              {row.kind === 'confirm' && <ConfirmCard message={row.message} />}
              {(row.kind === 'error' || row.kind === 'note') && (
                <p className={row.className}>{row.text}</p>
              )}
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              key="typing"
              className="assistant-panel__typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            >
              {liveText !== '' && (
                <span className="assistant-panel__live">
                  <Markdown>{liveText}</Markdown>
                </span>
              )}
              <span className="assistant-panel__dots" aria-hidden="true">
                <span className="assistant-panel__dot" />
                <span className="assistant-panel__dot" />
                <span className="assistant-panel__dot" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {secretWarning !== '' && (
          <motion.div
            key="secret"
            className="assistant-panel__secret"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="assistant-panel__secret-body">
              <span className="assistant-panel__secret-text">
                <span className="assistant-panel__secret-icon">
                  <Icon name="attention" />
                </span>
                {secretWarning}
              </span>
              <span className="assistant-panel__secret-actions">
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

      <footer className="assistant-panel__composer">
        <textarea
          ref={inputRef}
          className="assistant-panel__input"
          rows={1}
          value={draft}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => {
            onDraft(event.target.value);
          }}
          onKeyDown={onInputKeyDown}
        />
        <AnimatePresence initial={false} mode="popLayout">
          {isAsking ? (
            <motion.span
              key="stop"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              <Button size="sm" variant="secondary" onClick={onStop}>
                <Icon name="stop" /> {stopLabel}
              </Button>
            </motion.span>
          ) : (
            <motion.span
              key="send"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              <Button size="sm" variant="primary" disabled={!canSend} onClick={onSend}>
                {sendLabel}
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </footer>
    </motion.section>
  );
};
