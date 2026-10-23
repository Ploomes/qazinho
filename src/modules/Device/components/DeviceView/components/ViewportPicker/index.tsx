import type { IViewportPickerProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useViewportPickerViewModel } from './hooks';
import './styles.css';

/** The window size the browser opens at, picked before a run or changed during one. */
export const ViewportPicker: React.FC<IViewportPickerProps> = (props) => {
  const { options, hasNote } = useViewportPickerViewModel(props);
  const { t } = useTranslation();

  return (
    <div className="viewport-picker">
      <Eyebrow>{t('DEVICE.VIEWPORT')}</Eyebrow>
      <div className="viewport-picker__list" role="radiogroup">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.isActive}
            className={option.className}
            onClick={option.onSelect}
          >
            {option.isActive && (
              <motion.span
                layoutId={props.layoutId}
                className="viewport-picker__mark"
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              />
            )}
            <span className="viewport-picker__label">{option.label}</span>
            <span className="viewport-picker__size">{option.size}</span>
          </button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {hasNote && (
          <motion.div
            key="next"
            className="viewport-picker__note"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <p className="viewport-picker__note-text">{props.note}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
