import type { IMentionPickerProps } from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/types';
import type { PointerEvent } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MENTION_KIND_KEYS } from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/constants';

export const useMentionPickerViewModel = (props: IMentionPickerProps) => {
  const { references, query, hasReferences, highlighted, onPick, onHighlight } = props;
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const isEmpty = references.length === 0;

  return {
    listRef,
    isEmpty,
    emptyText: hasReferences
      ? t('CHAT.MENTION_NO_MATCH', { query })
      : t('CHAT.MENTION_NOTHING_YET'),
    hint: isEmpty ? t('CHAT.MENTION_HINT_EMPTY') : t('CHAT.MENTION_HINT'),
    rows: references.map((reference, index) => ({
      id: reference.id,
      title: reference.title,
      kindKey: MENTION_KIND_KEYS[reference.kind],
      isHighlighted: index === highlighted,
      onClick: () => {
        onPick(reference.id);
      },
      onPointerEnter: () => {
        onHighlight(index);
      },
    })),
    onPointerDown: (event: PointerEvent) => {
      event.preventDefault();
    },
  };
};
