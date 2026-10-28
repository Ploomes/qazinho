import type { ISuiteChangeCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, Intern } from '@/shared/components/atoms';
import { useSuiteChangeCardViewModel } from './hooks';
import './styles.css';

/**
 * O conserto do agente para o teste escolhido, como está: o que ele está fazendo, o que
 * disse, a run própria do QAzinho do teste, e o que o QA pode fazer com ele.
 */
export const SuiteChangeCard: React.FC<ISuiteChangeCardProps> = (props) => {
  const {
    className,
    transition,
    mood,
    internSize,
    isStill,
    icon,
    title,
    branch,
    from,
    isWorking,
    step,
    notes,
    summary,
    failure,
    check,
    files,
    added,
    removed,
    shipped,
    canStop,
    stopLabel,
    onStop,
    canReview,
    reviewLabel,
    onReview,
    canDiscard,
    discardLabel,
    onDiscard,
    canRetry,
    retryLabel,
    onRetry,
  } = useSuiteChangeCardViewModel(props);

  return (
    <section className={className} aria-live="polite">
      <header className="suite-change-card__head">
        <Intern mood={mood} size={internSize} isStill={isStill} />
        <div className="suite-change-card__heading">
          <span className="suite-change-card__title">
            <span className="suite-change-card__icon">
              <Icon name={icon} />
            </span>
            {title}
          </span>
          {branch !== '' && (
            <span className="suite-change-card__branch">
              <Icon name="branch" /> {branch}
            </span>
          )}
          {from !== '' && <span className="suite-change-card__from">{from}</span>}
        </div>
      </header>

      {isWorking && (
        <div className="suite-change-card__working">
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={step}
              className="suite-change-card__step"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={transition}
            >
              {step}
            </motion.span>
          </AnimatePresence>
          <ul className="suite-change-card__notes">
            <AnimatePresence initial={false}>
              {notes.map((note) => (
                <motion.li
                  key={note.key}
                  className={note.className}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                >
                  {note.icon !== null && <Icon name={note.icon} />}
                  <span className="suite-change-card__note-text">{note.text}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {summary !== '' && <p className="suite-change-card__summary">{summary}</p>}
      {failure !== '' && <p className="suite-change-card__failure">{failure}</p>}

      {check !== null && (
        <span className={check.className}>
          <Icon name={check.icon} /> {check.text}
        </span>
      )}

      {files !== '' && (
        <span className="suite-change-card__files">
          {files}
          <span className="suite-change-card__added">{added}</span>
          <span className="suite-change-card__removed">{removed}</span>
        </span>
      )}

      {shipped !== null &&
        (shipped.url === null ? (
          <span className="suite-change-card__sent">{shipped.label}</span>
        ) : (
          <a
            className="suite-change-card__link"
            href={shipped.url}
            target="_blank"
            rel="noreferrer"
          >
            {shipped.label} <Icon name="external" />
          </a>
        ))}

      <div className="suite-change-card__actions">
        {canStop && (
          <Button size="sm" variant="danger-quiet" onClick={onStop}>
            {stopLabel}
          </Button>
        )}
        {canDiscard && (
          <Button size="sm" variant="ghost" onClick={onDiscard}>
            {discardLabel}
          </Button>
        )}
        {canRetry && (
          <Button size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {canReview && (
          <Button size="sm" variant="primary" onClick={onReview}>
            {reviewLabel}
          </Button>
        )}
      </div>
    </section>
  );
};
