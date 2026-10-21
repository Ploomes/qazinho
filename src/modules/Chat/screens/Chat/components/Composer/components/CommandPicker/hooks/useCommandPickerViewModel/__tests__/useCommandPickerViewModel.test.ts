// @vitest-environment jsdom
import type { ICommandPickerProps } from '@/modules/Chat/screens/Chat/components/Composer/components/CommandPicker/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCommandPickerViewModel } from '@/modules/Chat/screens/Chat/components/Composer/components/CommandPicker/hooks/useCommandPickerViewModel';

function picker(props: Partial<ICommandPickerProps> = {}) {
  const all: ICommandPickerProps = {
    picker: {
      heading: 'commands',
      rows: [
        {
          id: 'code-plan',
          label: 'Plan from the code',
          tag: '/code',
          detail: null,
          isDisabled: false,
        },
        { id: 'later', label: 'Later', tag: null, detail: 'Not yet', isDisabled: true },
      ],
      note: null,
      hint: '↑↓ to choose',
    },
    highlighted: 0,
    onPick: vi.fn(),
    onHighlight: vi.fn(),
    ...props,
  };

  return { props: all, result: renderHook(() => useCommandPickerViewModel(all)).result };
}

describe('useCommandPickerViewModel', () => {
  it('marks the highlighted row, and a row that cannot be picked', () => {
    expect(
      picker({ highlighted: 1 }).result.current.rows.map(({ className }) => className),
    ).toEqual([
      'command-picker__row',
      'command-picker__row command-picker__row--highlighted command-picker__row--disabled',
    ]);
  });

  describe('onClick', () => {
    it('picks a row with a click', () => {
      const { result, props } = picker();

      result.current.rows[0]?.onClick();

      expect(props.onPick).toHaveBeenCalledWith('code-plan');
    });

    it('does NOT pick a row that cannot be picked', () => {
      const { result, props } = picker();

      result.current.rows[1]?.onClick();

      expect(props.onPick).not.toHaveBeenCalled();
    });
  });

  it('follows the pointer with the highlight', () => {
    const { result, props } = picker();

    result.current.rows[1]?.onPointerEnter();

    expect(props.onHighlight).toHaveBeenCalledWith(1);
  });
});
