import type { IMentionPickerProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useMentionPickerViewModel } from './hooks';
import './styles.css';

export const MentionPicker: React.FC<IMentionPickerProps> = (props) => {
  const { listRef, isEmpty, emptyText, hint, rows, onPointerDown } =
    useMentionPickerViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      className="mention-picker"
      initial={STICKER.rise.initial}
      animate={STICKER.rise.animate}
      exit={STICKER.rise.exit}
      onPointerDown={onPointerDown}
    >
      <div className="mention-picker__head">
        <Eyebrow>{t('CHAT.MENTION_HEADING')}</Eyebrow>
      </div>

      {isEmpty && <p className="mention-picker__empty">{emptyText}</p>}

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

      <div className="mention-picker__foot">{hint}</div>
    </motion.div>
  );
};
