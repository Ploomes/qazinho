// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useButtonViewModel } from '@/shared/components/atoms/Button/hooks/useButtonViewModel';

describe('useButtonViewModel', () => {
  describe('className', () => {
    it('falls back to the secondary button at the default size', () => {
      const { result } = renderHook(() => useButtonViewModel({ children: 'Run' }));

      expect(result.current.className).toBe('button button--secondary button--md');
    });

    it('carries the variant and the size it was given', () => {
      const { result } = renderHook(() =>
        useButtonViewModel({ children: 'Run', variant: 'primary', size: 'sm' }),
      );

      expect(result.current.className).toBe('button button--primary button--sm');
    });
  });

  describe('onButtonClick', () => {
    it('calls the handler it was given', () => {
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useButtonViewModel({ children: 'Run', onClick }),
      );

      result.current.onButtonClick();

      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does NOT call the handler when the button is disabled', () => {
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useButtonViewModel({ children: 'Run', onClick, disabled: true }),
      );

      result.current.onButtonClick();

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does nothing when there is no handler', () => {
      const { result } = renderHook(() => useButtonViewModel({ children: 'Run' }));

      expect(() => result.current.onButtonClick()).not.toThrow();
    });
  });
});
