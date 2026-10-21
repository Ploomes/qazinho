// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCaretViewModel } from '@/shared/components/atoms/Caret/hooks/useCaretViewModel';

describe('useCaretViewModel', () => {
  it('points right while what it opens is shut', () => {
    expect(
      renderHook(() => useCaretViewModel({ isOpen: false })).result.current.className,
    ).toBe('caret');
  });

  it('turns down once it is open', () => {
    expect(
      renderHook(() => useCaretViewModel({ isOpen: true })).result.current.className,
    ).toBe('caret caret--open');
  });
});
