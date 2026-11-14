import type { INothingStepProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import './styles.css';

/** Os dois começos sem nada do app: a loja de exemplo, ou planejar antes do app. */
export const NothingStep: React.FC<INothingStepProps> = (props) => (
  <div className="nothing-step">
    <div className="nothing-step__ways">
      {props.ways.map((way) => (
        <motion.div
          key={way.id}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: way.delay,
            duration: MOTION.durationSlow,
            ease: MOTION.ease,
          }}
        >
          <button
            type="button"
            className={way.className}
            aria-pressed={way.isOn}
            onClick={way.onPick}
          >
            <span className="pick-card__icon">
              <Icon name={way.icon} />
            </span>
            <span className="pick-card__label">{way.label}</span>
            <span className="pick-card__text">{way.text}</span>
            <span className="pick-card__check">
              <AnimatePresence initial={false}>
                {way.isOn && (
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
      ))}
    </div>

    <AnimatePresence initial={false}>
      {props.isIdea && (
        <motion.div
          key="idea"
          className="nothing-step__fold"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: MOTION.duration, ease: MOTION.ease }}
        >
          <div className="nothing-step__idea">
            <textarea
              className="nothing-step__text"
              value={props.idea}
              aria-label={props.ideaLabel}
              placeholder={props.ideaPlaceholder}
              rows={3}
              onChange={(event) => {
                props.onIdea(event.target.value);
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="new-project__foot">
      <AnimatePresence initial={false}>
        {props.hasFailure && (
          <motion.span
            key="failure"
            className="new-project__count new-project__count--bad"
            initial={STICKER.rise.initial}
            animate={STICKER.rise.animate}
            exit={STICKER.rise.exit}
          >
            {props.failure}
          </motion.span>
        )}
      </AnimatePresence>
      <div className="new-project__actions">
        <Button variant="ghost" onClick={props.onBack}>
          {props.backLabel}
        </Button>
        <Button variant="primary" disabled={!props.canStart} onClick={props.onStart}>
          {props.startLabel}
        </Button>
      </div>
    </div>
  </div>
);
