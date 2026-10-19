import type { IRunSectionProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useRunSectionViewModel } from './hooks';
import './styles.css';

/** A run in the chat as one box: its line on top, and when opened, everything the run said inside it. */
export const RunSection: React.FC<IRunSectionProps> = (props) => {
  const { caret, facts, isBodyShown, hasOpen, className, bodyTransition, onToggle } =
    useRunSectionViewModel(props);

  return (
    <section className={className}>
      <span className="run-section__at">{props.at}</span>
      <div className="run-section__box">
        <div className="run-section__bar">
          <button
            type="button"
            className="run-section__toggle"
            aria-expanded={isBodyShown}
            onClick={onToggle}
          >
            <span className="run-section__caret" aria-hidden="true">
              {caret}
            </span>
            <span className="run-section__dot" aria-hidden="true" />
            <span className="run-section__text">
              <span className="run-section__title">{props.title}</span>
              <span className="run-section__facts">{facts}</span>
            </span>
          </button>
          {hasOpen && (
            <button type="button" className="run-section__open" onClick={props.onOpen}>
              {props.openLabel}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {isBodyShown && (
            <motion.div
              key="body"
              className="run-section__body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={bodyTransition}
            >
              <div className="run-section__rows">{props.children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
