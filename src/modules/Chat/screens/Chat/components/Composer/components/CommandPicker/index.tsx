import type { ICommandPickerProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Eyebrow } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useCommandPickerViewModel } from './hooks';
import './styles.css';

/**
 * Os comandos que uma barra abre, depois o repositório e a branch de que o comando
 * precisa, um passo por vez.
 */
export const CommandPicker: React.FC<ICommandPickerProps> = (props) => {
  const { listRef, listStyle, swap, rows, onPointerDown } =
    useCommandPickerViewModel(props);

  return (
    <motion.div
      className="command-picker"
      style={listStyle}
      initial={STICKER.rise.initial}
      animate={STICKER.rise.animate}
      exit={STICKER.rise.exit}
      onPointerDown={onPointerDown}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={props.picker.heading} className="command-picker__step" {...swap}>
          <div className="command-picker__head">
            <Eyebrow>{props.picker.heading}</Eyebrow>
          </div>

          {rows.length > 0 && (
            <div
              ref={listRef}
              id="command-picker"
              role="listbox"
              aria-label={props.picker.heading}
              className="command-picker__list"
            >
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  role="option"
                  aria-selected={row.isHighlighted}
                  tabIndex={-1}
                  className={row.className}
                  onClick={row.onClick}
                  onPointerEnter={row.onPointerEnter}
                >
                  <span className="command-picker__line">
                    <span className="command-picker__label">{row.label}</span>
                    {row.tag !== null && (
                      <span className="command-picker__tag">{row.tag}</span>
                    )}
                  </span>
                  {row.detail !== null && (
                    <span className="command-picker__detail">{row.detail}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {props.picker.note !== null && (
            <p className="command-picker__note">{props.picker.note}</p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="command-picker__foot">{props.picker.hint}</div>
    </motion.div>
  );
};
