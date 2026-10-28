import type { IRunPickerProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { RunRow } from '@/modules/Run/screens/Runs/components/RunRow';
import { Icon } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useRunPickerViewModel } from './hooks';
import './styles.css';

/** A run em exibição no topo de Runs, abrindo para toda run para a qual trocar. */
export const RunPicker: React.FC<IRunPickerProps> = (props) => {
  const { ref, isOpen, triggerClassName, label, count, rows, onToggle, onPick } =
    useRunPickerViewModel(props);
  const { t } = useTranslation();

  return (
    <div ref={ref} className="run-picker">
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="run-picker__label">{label}</span>
        <RunRow row={props.current} factsNote={props.factsNote} />
        <span className="run-picker__handle">
          <span className="run-picker__count">{count}</span>
          <span className="run-picker__chevron" aria-hidden="true" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="menu"
            className="run-picker__menu"
            role="listbox"
            aria-label={t('RUN.HISTORY')}
            initial={STICKER.pop.initial}
            animate={STICKER.pop.animate}
            exit={STICKER.pop.exit}
          >
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                role="option"
                aria-selected={row.isSelected}
                className={row.className}
                onClick={() => {
                  onPick(row.id);
                }}
              >
                <span className="run-picker__check">
                  {row.isSelected && <Icon name="check" />}
                </span>
                <RunRow row={row} factsNote={props.factsNote} />
              </button>
            ))}

            {props.pager.isShown && (
              <div className="run-picker__pager">
                <span className="run-picker__pager-label">{props.pager.label}</span>
                <button
                  type="button"
                  className="run-picker__pager-button"
                  aria-label={t('RUN.PREVIOUS_PAGE')}
                  disabled={!props.pager.canGoBack}
                  onClick={props.onPreviousPage}
                >
                  <Icon name="caretLeft" />
                </button>
                <button
                  type="button"
                  className="run-picker__pager-button"
                  aria-label={t('RUN.NEXT_PAGE')}
                  disabled={!props.pager.canGoOn}
                  onClick={props.onNextPage}
                >
                  <Icon name="caretRight" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
