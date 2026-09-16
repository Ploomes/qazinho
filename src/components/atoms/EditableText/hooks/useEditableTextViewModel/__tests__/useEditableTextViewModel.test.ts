// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEditableTextViewModel } from '@/components/atoms/EditableText/hooks/useEditableTextViewModel';

function typing(value: string) {
  return { target: { value } } as React.ChangeEvent<HTMLTextAreaElement>;
}

describe('useEditableTextViewModel', () => {
  it('hands every keystroke straight up, so the plan is never half-saved', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useEditableTextViewModel({ value: 'Open the cart', placeholder: '', onCommit }),
    );

    result.current.onChange(typing('Open the cart page'));

    expect(onCommit).toHaveBeenCalledWith('Open the cart page');
  });

  it('does NOT change a plan the agent is running', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useEditableTextViewModel({
        value: 'Open the cart',
        placeholder: '',
        isLocked: true,
        onCommit,
      }),
    );

    result.current.onChange(typing('nope'));

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('a title reads bigger than a step', () => {
    const { result } = renderHook(() =>
      useEditableTextViewModel({
        value: 'Checkout',
        placeholder: '',
        isTitle: true,
        onCommit: vi.fn(),
      }),
    );

    expect(result.current.className).toContain('editable-text--title');
  });
});
