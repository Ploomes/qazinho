// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFindingNoteViewModel } from '@/modules/Chat/screens/Chat/components/FindingNote/hooks/useFindingNoteViewModel';

const MESSAGE = {
  id: 'm-4',
  kind: 'finding' as const,
  at: '22:18',
  runId: 'r-01',
  bugId: 'BUG-09',
  title: 'Yearly price differs',
};

describe('useFindingNoteViewModel', () => {
  describe('tag', () => {
    it('marks a bug filed on the side of a step as outside the plan', () => {
      const { result } = renderHook(() =>
        useFindingNoteViewModel({ message: MESSAGE, onOpenBug: vi.fn() }),
      );

      expect(result.current.tag).toBe('outside the plan');
    });

    it('marks a bug already open as seen again', () => {
      const { result } = renderHook(() =>
        useFindingNoteViewModel({
          message: { ...MESSAGE, isSeenAgain: true },
          onOpenBug: vi.fn(),
        }),
      );

      expect(result.current.tag).toBe('seen again');
    });
  });

  describe('onOpen', () => {
    it('opens the bug the run filed on the side of a step', () => {
      const onOpenBug = vi.fn();
      const { result } = renderHook(() =>
        useFindingNoteViewModel({
          message: {
            id: 'm-4',
            kind: 'finding',
            at: '22:18',
            runId: 'r-01',
            bugId: 'BUG-09',
            title: 'Yearly price differs',
          },
          onOpenBug,
        }),
      );

      result.current.onOpen();

      expect(onOpenBug).toHaveBeenCalledWith('BUG-09');
    });
  });
});
