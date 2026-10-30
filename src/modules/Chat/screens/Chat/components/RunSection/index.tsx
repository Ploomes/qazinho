import type { IRunSectionProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Caret, Icon } from '@/shared/components/atoms';
import { useRunSectionViewModel } from './hooks';
import './styles.css';

/**
 * Uma run no chat como uma caixa: a linha dela em cima, e quando aberta, tudo o que a run
 * disse dentro.
 */
export const RunSection: React.FC<IRunSectionProps> = (props) => {
  const { hasCaret, facts, isBodyShown, hasOpen, className, bodyTransition, onToggle } =
    useRunSectionViewModel(props);

  return (
    <section className={className}>
      <span className="run-section__at">
        {props.day !== '' && <span className="run-section__day">{props.day}</span>}
        {props.at}
      </span>
      <div className="run-section__box">
        <div className="run-section__bar">
          <button
            type="button"
            className="run-section__toggle"
            aria-expanded={isBodyShown}
            onClick={onToggle}
          >
            <span className="run-section__caret">
              {hasCaret && <Caret isOpen={isBodyShown} />}
            </span>
            <span className="run-section__dot" aria-hidden="true" />
            <span className="run-section__text">
              <span className="run-section__title">{props.title}</span>
              <span className="run-section__facts">{facts}</span>
            </span>
          </button>
          {hasOpen && (
            <button
              type="button"
              className="run-section__open"
              aria-label={props.openLabel ?? undefined}
              onClick={props.onOpen}
            >
              <span className="run-section__open-label">{props.openLabel}</span>
              <Icon name="arrow" />
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
