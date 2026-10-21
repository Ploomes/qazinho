import type { IConfirmCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useConfirmCardViewModel } from './hooks';
import './styles.css';

/** Something the assistant would remove, held until the QA answers on this card, which then says what they chose. */
export const ConfirmCard: React.FC<IConfirmCardProps> = (props) => {
  const {
    title,
    body,
    goLabel,
    keepLabel,
    isOpen,
    className,
    result,
    glyph,
    onGo,
    onKeep,
  } = useConfirmCardViewModel(props);

  return (
    <div className={className} role="group" aria-label={title}>
      <span className="confirm-card__title">{title}</span>
      <span className="confirm-card__body">{body}</span>

      <AnimatePresence initial={false} mode="wait">
        {isOpen ? (
          <motion.span
            key="ask"
            className="confirm-card__actions"
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.easeIn }}
          >
            <Button size="sm" variant="danger" onClick={onGo}>
              {goLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={onKeep}>
              {keepLabel}
            </Button>
          </motion.span>
        ) : (
          <motion.span
            key="result"
            className="confirm-card__result"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <span aria-hidden="true">{glyph}</span> {result}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
