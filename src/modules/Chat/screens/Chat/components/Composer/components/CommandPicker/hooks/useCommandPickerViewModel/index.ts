import type { ICommandPickerProps } from '@/modules/Chat/screens/Chat/components/Composer/components/CommandPicker/types';
import type { CSSProperties, PointerEvent } from 'react';
import { useEffect, useRef } from 'react';
import { COMMAND_PICKER } from '@/modules/Chat/screens/Chat/components/Composer/components/CommandPicker/constants';
import { MOTION } from '@/shared/constants';

export const useCommandPickerViewModel = (props: ICommandPickerProps) => {
  const { picker, highlighted, onPick, onHighlight } = props;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  return {
    listRef,
    listStyle: {
      '--command-row-height': `${String(COMMAND_PICKER.rowHeight)}px`,
      '--command-rows': String(COMMAND_PICKER.maxRows),
    } as CSSProperties,
    swap: {
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
      transition: { duration: MOTION.durationFast, ease: MOTION.ease },
    },
    rows: picker.rows.map((row, index) => ({
      ...row,
      isHighlighted: index === highlighted,
      className: [
        'command-picker__row',
        ...(index === highlighted ? ['command-picker__row--highlighted'] : []),
        ...(row.isBlocked ? ['command-picker__row--blocked'] : []),
      ].join(' '),
      onClick: () => {
        onPick(row.id);
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
