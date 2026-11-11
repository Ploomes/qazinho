import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, PlatformIcon } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useTargetChipViewModel } from './hooks';
import './styles.css';

/** O app em que o plano roda, um link na frase do cabeçalho, e o popover que o troca. */
export const TargetChip: React.FC = () => {
  const vm = useTargetChipViewModel();

  if (!vm.hasWorkspace) return null;

  const {
    isOpen,
    popoverRef,
    current,
    pickLabel,
    title,
    options,
    noneLabel,
    moreLabel,
    onToggle,
    onMore,
  } = vm;

  return (
    <div className="target-chip">
      <button
        type="button"
        className="target-chip__button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title={current?.kindLabel}
        onClick={onToggle}
      >
        {current === null ? pickLabel : current.build}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="popover"
            ref={popoverRef}
            className="target-chip__popover"
            role="dialog"
            aria-label={title}
            initial={STICKER.pop.initial}
            animate={STICKER.pop.animate}
            exit={STICKER.pop.exit}
          >
            <header className="target-chip__head">
              <span className="target-chip__title">{title}</span>
            </header>

            <ul className="target-chip__options">
              {options.map((option) => (
                <li key={option.kind} className="target-chip__option">
                  <button
                    type="button"
                    className={
                      option.isActive
                        ? 'target-chip__pick target-chip__pick--active'
                        : 'target-chip__pick'
                    }
                    disabled={!option.hasValue}
                    aria-pressed={option.isActive}
                    onClick={option.onSelect}
                  >
                    <PlatformIcon kind={option.kind} size={16} />
                    <span className="target-chip__option-kind">{option.kindLabel}</span>
                    <span className="target-chip__option-value">
                      {option.hasValue ? option.value : noneLabel}
                    </span>
                    {option.isActive && <Icon name="check" />}
                  </button>
                  <Button variant="ghost" size="sm" onClick={option.onChoose}>
                    {option.chooseLabel}
                  </Button>
                </li>
              ))}
            </ul>

            <div className="target-chip__foot">
              <Button variant="secondary" size="sm" onClick={onMore}>
                {moreLabel}
                <Icon name="arrow" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
