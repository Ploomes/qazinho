import type { IMentionPickerProps } from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/types';
import type { PointerEvent } from 'react';
import { useEffect, useRef } from 'react';
import { MENTION_KIND_KEYS } from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/constants';

export const useMentionPickerViewModel = (props: IMentionPickerProps) => {
  const { references, highlighted, onPick, onHighlight } = props;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  return {
    listRef,
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
    // A press would take the focus out of the input, and the QA would have to click back into it.
    onPointerDown: (event: PointerEvent) => {
      event.preventDefault();
    },
  };
};
