// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEditableTextViewModel } from '@/shared/components/atoms/EditableText/hooks/useEditableTextViewModel';

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

  it('takes the cursor when asked, unless the plan is locked', () => {
    const focused = renderHook(() =>
      useEditableTextViewModel({
        value: '',
        placeholder: '',
        isAutoFocused: true,
        onCommit: vi.fn(),
      }),
    );
    const locked = renderHook(() =>
      useEditableTextViewModel({
        value: '',
        placeholder: '',
        isAutoFocused: true,
        isLocked: true,
        onCommit: vi.fn(),
      }),
    );

    expect(focused.result.current.isAutoFocused).toBe(true);
    expect(locked.result.current.isAutoFocused).toBe(false);
  });
});
