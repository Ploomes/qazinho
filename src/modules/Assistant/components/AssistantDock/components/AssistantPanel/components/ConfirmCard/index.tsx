import type { IConfirmCardProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useConfirmCardViewModel } from './hooks';
import './styles.css';

/**
 * Algo que o assistente removeria ou mandaria para fora, segurado até o QA responder
 * neste cartão, que depois diz o que ele escolheu.
 */
export const ConfirmCard: React.FC<IConfirmCardProps> = (props) => {
  const {
    title,
    body,
    goLabel,
    goVariant,
    keepLabel,
    isOpen,
    className,
    result,
    icon,
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
            <Button size="sm" variant={goVariant} onClick={onGo}>
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
            <Icon name={icon} /> {result}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
