// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useVariableEditorViewModel } from '@/modules/Project/components/ProjectModal/components/VariableField/components/VariableEditor/hooks/useVariableEditorViewModel';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useVariableEditorViewModel', () => {
  describe('ref', () => {
    /** The editor opens at the foot of a long window: it scrolls itself whole into view once its fold opened. */
    it('brings the editor into view once it opened, and not before', () => {
      vi.useFakeTimers();

      const element = document.createElement('div');
      const scrollIntoView = vi.fn();

      element.scrollIntoView = scrollIntoView;

      const { result } = renderHook(() => {
        const viewModel = useVariableEditorViewModel();

        viewModel.ref.current = element;

        return viewModel;
      });

      expect(result.current.ref.current).toBe(element);
      expect(scrollIntoView).not.toHaveBeenCalled();

      vi.runAllTimers();

      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        behavior: 'smooth',
      });
    });

    it('does NOT scroll an editor closed before it opened', () => {
      vi.useFakeTimers();

      const scrollIntoView = vi.fn();
      const { unmount } = renderHook(() => {
        const viewModel = useVariableEditorViewModel();
        const element = document.createElement('div');

        element.scrollIntoView = scrollIntoView;
        viewModel.ref.current = element;

        return viewModel;
      });

      unmount();
      vi.runAllTimers();

      expect(scrollIntoView).not.toHaveBeenCalled();
    });
  });
});
