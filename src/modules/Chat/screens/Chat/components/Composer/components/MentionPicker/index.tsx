import type { IMentionPickerProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/components/atoms';
import { MOTION } from '@/constants';
import { useMentionPickerViewModel } from './hooks';
import './styles.css';

export const MentionPicker: React.FC<IMentionPickerProps> = (props) => {
  const { listRef, rows, onPointerDown } = useMentionPickerViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      className="mention-picker"
      initial={{ opacity: 0, scale: 0.98, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 6 }}
      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
      onPointerDown={onPointerDown}
    >
      <div className="mention-picker__head">
        <Eyebrow>{t('CHAT.MENTION_HEADING')}</Eyebrow>
      </div>

      <div
        ref={listRef}
        id="mention-picker"
        role="listbox"
        className="mention-picker__list"
      >
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            role="option"
            aria-selected={row.isHighlighted}
            tabIndex={-1}
            className={
              row.isHighlighted
                ? 'mention-picker__row mention-picker__row--highlighted'
                : 'mention-picker__row'
            }
            onClick={row.onClick}
            onPointerEnter={row.onPointerEnter}
          >
            <span className="mention-picker__kind">{t(row.kindKey)}</span>
            <span className="mention-picker__id">@{row.id}</span>
            <span className="mention-picker__title">{row.title}</span>
          </button>
        ))}
      </div>

      <div className="mention-picker__foot">{t('CHAT.MENTION_HINT')}</div>
    </motion.div>
  );
};
