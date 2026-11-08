import type { IRunButtonProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon, Kbd } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useRunButtonViewModel } from './hooks';
import './styles.css';

/**
 * Um sticker lima cortado em dois: a face leva o plano à etapa seguinte, e o caret abre
 * os outros jeitos de rodá-lo, cada um dizendo o que faz.
 */
export const RunButton: React.FC<IRunButtonProps> = (props) => {
  const {
    ref,
    className,
    style,
    runLabel,
    isDisabled,
    tip,
    hasChoices,
    chooseLabel,
    isOpen,
    caretClassName,
    foldTransition,
    options,
    onRun,
    onToggle,
  } = useRunButtonViewModel(props);

  return (
    <div ref={ref} className={className} style={style} title={tip}>
      <div className="run-button__face">
        <button
          type="button"
          className="run-button__run"
          disabled={isDisabled}
          onClick={onRun}
        >
          {runLabel}
        </button>

        <AnimatePresence initial={false}>
          {hasChoices && (
            <motion.span
              key="choices"
              className="run-button__fold"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={foldTransition}
            >
              <button
                type="button"
                className="run-button__more"
                aria-label={chooseLabel}
                title={chooseLabel}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                disabled={isDisabled}
                onClick={onToggle}
              >
                <span className={caretClassName}>
                  <Icon name="caretDown" />
                </span>
              </button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="menu"
            className="run-button__menu"
            role="menu"
            aria-label={chooseLabel}
            initial={STICKER.pop.initial}
            animate={STICKER.pop.animate}
            exit={STICKER.pop.exit}
          >
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitem"
                className="run-button__option"
                onClick={option.onPick}
              >
                <span className="run-button__option-icon">
                  <Icon name={option.icon} />
                </span>
                <span className="run-button__option-title">{option.title}</span>
                <span className="run-button__option-combo">
                  {option.combo !== null && <Kbd combo={option.combo} />}
                </span>
                <span className="run-button__option-hint">{option.hint}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
