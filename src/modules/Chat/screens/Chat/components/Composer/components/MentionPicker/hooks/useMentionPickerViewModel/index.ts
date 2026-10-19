import type { IMentionPickerProps } from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/types';
import type { CSSProperties, PointerEvent } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MENTION_PICKER,
  MENTION_TAB_KEYS,
} from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/constants';
import { MOTION } from '@/shared/constants';

export const useMentionPickerViewModel = (props: IMentionPickerProps) => {
  const { references, query, hasReferences, highlighted, onPick, onHighlight, onTab } =
    props;
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const isEmpty = references.length === 0;
  const rowsShown = Math.min(
    MENTION_PICKER.maxRows,
    Math.max(references.length, ...props.tabs.map(({ count }) => count)),
  );

  return {
    listRef,
    isEmpty,
    emptyText: hasReferences
      ? t('CHAT.MENTION_NO_MATCH', { query })
      : t('CHAT.MENTION_NOTHING_YET'),
    hint: isEmpty ? t('CHAT.MENTION_HINT_EMPTY') : t('CHAT.MENTION_HINT'),
    tabs: hasReferences
      ? props.tabs.map((tab) => ({
          kind: tab.kind,
          label: t(MENTION_TAB_KEYS[tab.kind]),
          count: tab.count,
          isActive: tab.isActive,
          isDisabled: tab.count === 0,
          onClick: () => {
            onTab(tab.kind);
          },
        }))
      : [],
    rows: references.map((reference, index) => ({
      id: reference.id,
      title: reference.title,
      isHighlighted: index === highlighted,
      onClick: () => {
        onPick(reference.id);
      },
      onPointerEnter: () => {
        onHighlight(index);
      },
    })),
    listStyle: {
      '--mention-row-height': `${String(MENTION_PICKER.rowHeight)}px`,
      '--mention-list-padding': `${String(MENTION_PICKER.listPadding)}px`,
    } as CSSProperties,
    listHeight:
      rowsShown === 0
        ? 0
        : rowsShown * MENTION_PICKER.rowHeight + 2 * MENTION_PICKER.listPadding,
    listTransition: { duration: MOTION.duration, ease: MOTION.ease },
    onPointerDown: (event: PointerEvent) => {
      event.preventDefault();
    },
  };
};
