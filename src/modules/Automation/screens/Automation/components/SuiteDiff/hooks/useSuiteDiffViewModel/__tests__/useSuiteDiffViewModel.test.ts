// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSuiteDiffViewModel } from '@/modules/Automation/screens/Automation/components/SuiteDiff/hooks/useSuiteDiffViewModel';

const FILE = {
  path: 'tests/hc-1/ct-nav.spec.ts',
  status: 'modified' as const,
  additions: 1,
  deletions: 1,
  patch:
    "@@ -3,2 +3,2 @@\n   await page.goto('/');\n-  click('Meu carrinho');\n+  click('Carrinho');",
};

describe('useSuiteDiffViewModel', () => {
  it('names the file, what was done to it and the lines it gained and lost', () => {
    const { result } = renderHook(() =>
      useSuiteDiffViewModel({ file: FILE, isOpenAtFirst: true }),
    );

    expect(result.current).toMatchObject({
      path: 'tests/hc-1/ct-nav.spec.ts',
      status: 'changed',
      statusClassName: 'suite-diff__status suite-diff__status--modified',
      added: '+1',
      removed: '−1',
      isOpen: true,
    });
  });

  it('numbers each line and marks it added, removed or kept', () => {
    const { result } = renderHook(() =>
      useSuiteDiffViewModel({ file: FILE, isOpenAtFirst: true }),
    );

    expect(
      result.current.lines.map(({ className, old, new: next }) => [className, old, next]),
    ).toEqual([
      ['suite-diff__line suite-diff__line--hunk', '', ''],
      ['suite-diff__line suite-diff__line--same', '3', '3'],
      ['suite-diff__line suite-diff__line--del', '4', ''],
      ['suite-diff__line suite-diff__line--add', '', '4'],
    ]);
  });

  describe('onToggle', () => {
    it('folds a file open at first, and opens it again', () => {
      const { result } = renderHook(() =>
        useSuiteDiffViewModel({ file: FILE, isOpenAtFirst: true }),
      );

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('starts a file folded when asked', () => {
      expect(
        renderHook(() => useSuiteDiffViewModel({ file: FILE, isOpenAtFirst: false }))
          .result.current.isOpen,
      ).toBe(false);
    });
  });
});
