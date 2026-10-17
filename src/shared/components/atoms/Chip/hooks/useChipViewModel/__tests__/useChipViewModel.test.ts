// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChipViewModel } from '@/shared/components/atoms/Chip/hooks/useChipViewModel';

describe('useChipViewModel', () => {
  it('is a plain label while nothing listens to it', () => {
    const { result } = renderHook(() => useChipViewModel({ children: 'Web' }));

    expect(result.current.isPressable).toBe(false);
    expect(result.current.hasDot).toBe(false);
  });

  it('becomes pressable as soon as a handler arrives', () => {
    const onClick = vi.fn();
    const { result } = renderHook(() => useChipViewModel({ children: 'Web', onClick }));

    expect(result.current.isPressable).toBe(true);

    result.current.onChipClick();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('carries the dot only when a tone was asked for', () => {
    const { result } = renderHook(() =>
      useChipViewModel({ children: 'Claude Code', dotTone: 'var(--pass)' }),
    );

    expect(result.current.hasDot).toBe(true);
    expect(result.current.dotTone).toBe('var(--pass)');
  });

  it('does nothing when pressed without a handler', () => {
    const { result } = renderHook(() => useChipViewModel({ children: 'Web' }));

    expect(() => result.current.onChipClick()).not.toThrow();
  });

  it('announces a menu when it carries a caret, and nothing otherwise', () => {
    const withCaret = renderHook(() =>
      useChipViewModel({ children: 'Claude', hasCaret: true }),
    );
    const plain = renderHook(() => useChipViewModel({ children: 'Web' }));

    expect(withCaret.result.current.popup).toBe('menu');
    expect(plain.result.current.popup).toBeUndefined();
  });
});
