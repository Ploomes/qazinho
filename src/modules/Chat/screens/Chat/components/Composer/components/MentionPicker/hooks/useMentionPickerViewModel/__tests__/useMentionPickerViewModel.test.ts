// @vitest-environment jsdom
import type { PointerEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMentionPickerViewModel } from '@/modules/Chat/screens/Chat/components/Composer/components/MentionPicker/hooks/useMentionPickerViewModel';

const PROPS = {
  references: [
    {
      kind: 'bug' as const,
      id: 'BUG-01',
      title: 'Coupon accepts expired codes',
      facts: [],
    },
    { kind: 'bug' as const, id: 'BUG-02', title: 'Cart forgets the coupon', facts: [] },
  ],
  tabs: [
    { kind: 'case' as const, count: 3, isActive: false },
    { kind: 'bug' as const, count: 2, isActive: true },
    { kind: 'run' as const, count: 0, isActive: false },
  ],
  query: '',
  hasReferences: true,
  highlighted: 1,
  onPick: vi.fn(),
  onHighlight: vi.fn(),
  onTab: vi.fn(),
};

describe('useMentionPickerViewModel', () => {
  describe('tabs', () => {
    it('offers the cases, the bugs and the runs, each with what it holds', () => {
      const { result } = renderHook(() => useMentionPickerViewModel(PROPS));

      expect(
        result.current.tabs.map(({ label, count, isActive, isDisabled }) => [
          label,
          count,
          isActive,
          isDisabled,
        ]),
      ).toEqual([
        ['Cases', 3, false, false],
        ['Bugs', 2, true, false],
        ['Runs', 0, false, true],
      ]);
    });

    it('opens the tab that was clicked', () => {
      const onTab = vi.fn();
      const { result } = renderHook(() => useMentionPickerViewModel({ ...PROPS, onTab }));

      result.current.tabs[0]?.onClick();

      expect(onTab).toHaveBeenCalledWith('case');
    });

    it('offers no tab while the workspace has nothing to point at', () => {
      const { result } = renderHook(() =>
        useMentionPickerViewModel({ ...PROPS, references: [], hasReferences: false }),
      );

      expect(result.current.tabs).toEqual([]);
    });
  });

  describe('rows', () => {
    it('lists what the tab holds and marks the highlighted one', () => {
      const { result } = renderHook(() => useMentionPickerViewModel(PROPS));

      expect(
        result.current.rows.map(({ id, isHighlighted }) => [id, isHighlighted]),
      ).toEqual([
        ['BUG-01', false],
        ['BUG-02', true],
      ]);
    });

    it('picks the reference that was clicked', () => {
      const onPick = vi.fn();
      const { result } = renderHook(() =>
        useMentionPickerViewModel({ ...PROPS, onPick }),
      );

      result.current.rows[0]?.onClick();

      expect(onPick).toHaveBeenCalledWith('BUG-01');
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

  describe('the empty state', () => {
    it('stays out of the way while there are rows', () => {
      const { result } = renderHook(() => useMentionPickerViewModel(PROPS));

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.hint).toContain('← → to switch tabs');
    });

    it('says the workspace has nothing to point at yet', () => {
      const { result } = renderHook(() =>
        useMentionPickerViewModel({ ...PROPS, references: [], hasReferences: false }),
      );

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.emptyText).toContain('Nothing to point at yet');
      expect(result.current.hint).toBe('Esc to close');
    });

    it('says the word typed matches nothing, when there is something to match', () => {
      const { result } = renderHook(() =>
        useMentionPickerViewModel({ ...PROPS, references: [], query: 'zzz' }),
      );

      expect(result.current.emptyText).toBe('Nothing here matches “zzz”.');
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
