// @vitest-environment jsdom
import type { IRunPickerProps } from '@/modules/Run/screens/Runs/components/RunPicker/types';
import type { IRunRowSummary } from '@/modules/Run/screens/Runs/components/RunRow/types';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRunPickerViewModel } from '@/modules/Run/screens/Runs/components/RunPicker/hooks/useRunPickerViewModel';

const run = (id: string, isSelected = false): IRunRowSummary => ({
  id,
  what: 'The whole plan',
  isSelected,
  ended: null,
  counts: { passed: 1, failed: 0, blocked: 0, skipped: 0 },
  facts: '0:42',
  startedAt: '09:41',
});

function picker(props: Partial<IRunPickerProps> = {}) {
  return renderHook(() =>
    useRunPickerViewModel({
      current: run('r-02', true),
      runs: [run('r-02', true), run('r-01')],
      pager: { isShown: false, label: '', canGoBack: false, canGoOn: false },
      factsNote: '',
      onSelect: vi.fn(),
      onPreviousPage: vi.fn(),
      onNextPage: vi.fn(),
      ...props,
    }),
  );
}

describe('useRunPickerViewModel', () => {
  describe('onToggle', () => {
    it('opens the list of runs and closes it again', () => {
      const view = picker();

      expect(view.result.current.isOpen).toBe(false);

      act(() => {
        view.result.current.onToggle();
      });

      expect(view.result.current).toMatchObject({ isOpen: true, caret: '▴' });

      act(() => {
        view.result.current.onToggle();
      });

      expect(view.result.current.isOpen).toBe(false);
    });
  });

  describe('onPick', () => {
    it('shows the run picked and folds the list away', () => {
      const onSelect = vi.fn();
      const view = picker({ onSelect });

      act(() => {
        view.result.current.onToggle();
      });
      act(() => {
        view.result.current.onPick('r-01');
      });

      expect(onSelect).toHaveBeenCalledWith('r-01');
      expect(view.result.current.isOpen).toBe(false);
    });
  });

  it('marks the run on show, and no other', () => {
    expect(picker().result.current.rows.map(({ className }) => className)).toEqual([
      'run-picker__option run-picker__option--selected',
      'run-picker__option',
    ]);
  });
});
