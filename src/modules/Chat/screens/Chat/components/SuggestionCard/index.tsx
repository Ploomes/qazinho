import type { ISuggestionCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Eyebrow, Icon, Markdown } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useSuggestionCardViewModel } from './hooks';
import './styles.css';

/**
 * O plano que uma exploração sugere, no chat: o que o explorador viu, os casos que
 * testaria, e o jeito de levá-los ao plano.
 */
export const SuggestionCard: React.FC<ISuggestionCardProps> = (props) => {
  const { eyebrow, summary, cases, isTaken, takeLabel, takenLabel, onTake } =
    useSuggestionCardViewModel(props);

  return (
    <section className="suggestion-card">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="suggestion-card__summary">
        <Markdown>{summary}</Markdown>
      </div>

      <ol className="suggestion-card__cases">
        {cases.map((one) => (
          <li key={one.key} className="suggestion-card__case">
            <span className="suggestion-card__priority">{one.priority}</span>
            <span className="suggestion-card__title">{one.title}</span>
          </li>
        ))}
      </ol>

      <div className="suggestion-card__foot">
        <AnimatePresence mode="wait" initial={false}>
          {isTaken ? (
            <motion.span
              key="taken"
              className="suggestion-card__taken"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              <Icon name="passed" /> {takenLabel}
            </motion.span>
          ) : (
            <motion.span
              key="take"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
            >
              <Button variant="primary" size="sm" onClick={onTake}>
                {takeLabel}
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
