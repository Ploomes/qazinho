// @vitest-environment jsdom
import type { KeyboardEvent } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useComposerViewModel } from '@/modules/Chat/screens/Chat/components/Composer/hooks/useComposerViewModel';

const PROPS = {
  value: 'Test the whole checkout',
  targetLabel: 'Web · https://crmweb.com',
  agentLabel: 'Claude Code · Sonnet',
  onChange: vi.fn(),
  onSend: vi.fn(),
};

function pressed(key: string, shiftKey = false) {
  return {
    key,
    shiftKey,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLInputElement>;
}

describe('useComposerViewModel', () => {
  it('sends what the QA typed', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onSendClick();

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('does NOT send an empty message', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() =>
      useComposerViewModel({ ...PROPS, value: '   ', onSend }),
    );

    expect(result.current.canSend).toBe(false);

    result.current.onSendClick();

    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends on Enter', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onKeyDown(pressed('Enter'));

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('does NOT send on shift-Enter, which is how a second line is typed', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onKeyDown(pressed('Enter', true));

    expect(onSend).not.toHaveBeenCalled();
  });
});
