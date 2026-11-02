import type { IViewportPickerProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useViewportPickerViewModel } from './hooks';
import './styles.css';

/**
 * O tamanho de janela em que o navegador abre, num menu pequeno, escolhido antes de uma
 * run ou mudado durante uma.
 */
export const ViewportPicker: React.FC<IViewportPickerProps> = (props) => {
  const { ref, isOpen, current, label, options, onToggle } =
    useViewportPickerViewModel(props);

  return (
    <div ref={ref} className="viewport-picker">
      <button
        type="button"
        className="viewport-picker__trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {current}
        <Icon name="caretDown" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="menu"
            className="viewport-picker__menu"
            role="listbox"
            aria-label={label}
            initial={STICKER.pop.initial}
            animate={STICKER.pop.animate}
            exit={STICKER.pop.exit}
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.isActive}
                className="viewport-picker__option"
                onClick={option.onSelect}
              >
                <span className="viewport-picker__mark">
                  {option.isActive && <Icon name="check" />}
                </span>
                <span className="viewport-picker__label">{option.label}</span>
                <span className="viewport-picker__size">{option.size}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
