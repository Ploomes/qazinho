import type { ITalkSectionProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Caret, Icon } from '@/shared/components/atoms';
import { useTalkSectionViewModel } from './hooks';
import './styles.css';

/**
 * Uma conversa do agente de código do QA com o agente do chat: uma linha no meio do chat
 * que abre as mensagens dele, as respostas, e quando ele leu a última.
 */
export const TalkSection: React.FC<ITalkSectionProps> = (props) => {
  const { className, isBodyShown, hasReceipt, bodyTransition, onToggle } =
    useTalkSectionViewModel(props);

  return (
    <section className={className}>
      <button
        type="button"
        className="talk-section__marker"
        aria-expanded={isBodyShown}
        onClick={onToggle}
      >
        <span className="talk-section__rule" aria-hidden="true" />
        <span className="talk-section__mark" aria-hidden="true">
          <Icon name="sparkle" />
        </span>
        <span className="talk-section__title">{props.title}</span>
        <span className="talk-section__facts">{props.facts}</span>
        <span className="talk-section__caret">
          <Caret isOpen={isBodyShown} />
        </span>
        <span className="talk-section__rule" aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {isBodyShown && (
          <motion.div
            key="body"
            className="talk-section__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={bodyTransition}
          >
            <div className="talk-section__rows">
              {props.children}
              {hasReceipt && (
                <p className="talk-section__receipt">
                  <Icon name="check" />
                  {props.receipt}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
