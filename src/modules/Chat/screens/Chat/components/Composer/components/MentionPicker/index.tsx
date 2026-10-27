import type { IMentionPickerProps } from './types';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Eyebrow } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import { MENTION_TAB_MARK } from './constants';
import { useMentionPickerViewModel } from './hooks';
import './styles.css';

/**
 * What the QA can point the agent at with @, a tab for the plan's cases, one for bugs and
 * one for runs.
 */
export const MentionPicker: React.FC<IMentionPickerProps> = (props) => {
  const {
    listRef,
    isEmpty,
    emptyText,
    hint,
    tabs,
    rows,
    listStyle,
    listHeight,
    listTransition,
    onPointerDown,
  } = useMentionPickerViewModel(props);
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
        {tabs.length > 0 && (
          <div
            className="mention-picker__tabs"
            role="tablist"
            aria-label={t('CHAT.MENTION_HEADING')}
          >
            {tabs.map((tab) => (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={tab.isActive}
                tabIndex={-1}
                disabled={tab.isDisabled}
                className={
                  tab.isActive
                    ? 'mention-picker__tab mention-picker__tab--active'
                    : 'mention-picker__tab'
                }
                onClick={tab.onClick}
              >
                {tab.isActive && (
                  <motion.span
                    layoutId={MENTION_TAB_MARK}
                    className="mention-picker__tab-mark"
                    transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                  />
                )}
                <span className="mention-picker__tab-label">{tab.label}</span>
                <span className="mention-picker__tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isEmpty && <p className="mention-picker__empty">{emptyText}</p>}

      <motion.div
        className="mention-picker__viewport"
        style={listStyle}
        initial={false}
        animate={{ height: listHeight }}
        transition={listTransition}
      >
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
              <span className="mention-picker__id">@{row.id}</span>
              <span className="mention-picker__title">{row.title}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="mention-picker__foot">{hint}</div>
    </motion.div>
  );
};
