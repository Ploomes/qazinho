import type { IPickStepProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import './styles.css';

/** Os cartões do que o QA já tem do app, de marcar quantos quiser, e o "nada" à parte. */
export const PickStep: React.FC<IPickStepProps> = (props) => (
  <div className="pick-step">
    <div className="pick-step__grid">
      {props.cards.map((card) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: card.delay,
            duration: MOTION.durationSlow,
            ease: MOTION.ease,
          }}
        >
          <motion.button
            type="button"
            className={card.className}
            aria-pressed={card.isOn}
            animate={{ opacity: card.opacity }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
            onClick={card.onToggle}
          >
            <span className="pick-card__icon">
              <Icon name={card.icon} />
            </span>
            <span className="pick-card__label">{card.label}</span>
            <span className="pick-card__text">{card.text}</span>
            <span className="pick-card__check">
              <AnimatePresence initial={false}>
                {card.isOn && (
                  <motion.span
                    key="tick"
                    className="pick-card__tick"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1, transition: STICKER.spring }}
                    exit={{
                      opacity: 0,
                      scale: 0.5,
                      transition: { duration: MOTION.durationFast },
                    }}
                  >
                    <Icon name="check" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.button>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: props.none.delay,
        duration: MOTION.durationSlow,
        ease: MOTION.ease,
      }}
    >
      <button
        type="button"
        className={props.none.className}
        aria-pressed={props.none.isOn}
        onClick={props.none.onToggle}
      >
        <span className="pick-none__icon">
          <Icon name="sparkle" />
        </span>
        <span className="pick-none__words">
          <span className="pick-none__label">{props.none.label}</span>
          <span className="pick-none__text">{props.none.text}</span>
        </span>
        <span className="pick-card__check pick-none__check">
          <AnimatePresence initial={false}>
            {props.none.isOn && (
              <motion.span
                key="tick"
                className="pick-card__tick"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1, transition: STICKER.spring }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  transition: { duration: MOTION.durationFast },
                }}
              >
                <Icon name="check" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>
    </motion.div>

    <div className="new-project__foot">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={props.countLabel}
          className="new-project__count"
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: MOTION.duration, ease: MOTION.ease },
          }}
          exit={{ opacity: 0, y: -8, transition: { duration: MOTION.durationFast } }}
        >
          {props.countLabel}
        </motion.span>
      </AnimatePresence>
      <div className="new-project__actions">
        <Button variant="ghost" onClick={props.onCancel}>
          {props.cancelLabel}
        </Button>
        <Button
          variant="primary"
          disabled={!props.canContinue}
          onClick={props.onContinue}
        >
          {props.continueLabel}
          <Icon name="arrow" />
        </Button>
      </div>
    </div>
  </div>
);
