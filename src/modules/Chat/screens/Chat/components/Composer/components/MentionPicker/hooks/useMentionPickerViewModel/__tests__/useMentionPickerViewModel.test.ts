// @vitest-environment jsdom
import type { PointerEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMentionPickerViewModel } from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/hooks/useMentionPickerViewModel';

const PROPS = {
  references: [
    { kind: 'run' as const, id: 'r-02', title: 'The whole plan', facts: [] },
    {
      kind: 'bug' as const,
      id: 'BUG-01',
      title: 'Coupon accepts expired codes',
      facts: [],
    },
  ],
  highlighted: 1,
  onPick: vi.fn(),
  onHighlight: vi.fn(),
};

describe('useMentionPickerViewModel', () => {
  describe('rows', () => {
    it('labels each reference with its kind and marks the highlighted one', () => {
      const { result } = renderHook(() => useMentionPickerViewModel(PROPS));

      expect(
        result.current.rows.map(({ kindKey, isHighlighted }) => [kindKey, isHighlighted]),
      ).toEqual([
        ['CHAT.MENTION_RUN', false],
        ['CHAT.MENTION_BUG', true],
      ]);
    });

    it('picks the reference that was clicked', () => {
      const onPick = vi.fn();
      const { result } = renderHook(() =>
        useMentionPickerViewModel({ ...PROPS, onPick }),
      );

      result.current.rows[0]?.onClick();

      expect(onPick).toHaveBeenCalledWith('r-02');
    });

    it('moves the highlight to the row under the pointer', () => {
      const onHighlight = vi.fn();
      const { result } = renderHook(() =>
        useMentionPickerViewModel({ ...PROPS, onHighlight }),
      );

      result.current.rows[0]?.onPointerEnter();

      expect(onHighlight).toHaveBeenCalledWith(0);
    });

    it('shows no row when nothing matches', () => {
      const { result } = renderHook(() =>
        useMentionPickerViewModel({ ...PROPS, references: [] }),
      );

      expect(result.current.rows).toEqual([]);
    });
  });

  describe('onPointerDown', () => {
    it('keeps the focus in the input, so the QA keeps typing after a pick', () => {
      const event = { preventDefault: vi.fn() } as unknown as PointerEvent;
      const { result } = renderHook(() => useMentionPickerViewModel(PROPS));

      result.current.onPointerDown(event);

      expect(event.preventDefault).toHaveBeenCalledOnce();
    });
  });
});
