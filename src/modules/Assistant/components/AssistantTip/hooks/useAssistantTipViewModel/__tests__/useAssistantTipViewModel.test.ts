// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSISTANT_TIP } from '@/modules/Assistant/components/AssistantTip/constants';
import { useAssistantTipViewModel } from '@/modules/Assistant/components/AssistantTip/hooks/useAssistantTipViewModel';
import { useAssistantStore } from '@/store';

const LINE = 'Connect Jira here, then come back to /jira.';

/** O rosto do Estagiário numa janela de 1000px: termina 16px antes da borda. */
const ANCHOR = {
  current: {
    getBoundingClientRect: () => ({ bottom: 46, right: 984 }) as DOMRect,
  } as HTMLElement,
};

const tip = () => renderHook(() => useAssistantTipViewModel({ anchorRef: ANCHOR }));

const say = (text = LINE) => {
  act(() => {
    useAssistantStore.getState().say(text);
  });
};

const pass = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('innerWidth', 1000);
  useAssistantStore.setState({ tip: null });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useAssistantTipViewModel', () => {
  it('says nothing until something is said', () => {
    expect(tip().result.current.tip).toBeNull();
  });

  it('shows what was said, and leaves on its own after a few seconds', () => {
    const { result } = tip();

    say();

    expect(result.current.tip?.text).toBe(LINE);

    pass(ASSISTANT_TIP.minHoldMs - 1);

    expect(result.current.tip).not.toBeNull();

    pass(1);

    expect(result.current.tip).toBeNull();
  });

  it('sits under the face, wherever the title bar put it', () => {
    const { result } = tip();

    say();

    expect(result.current.style).toMatchObject({
      '--assistant-tip-top': '46px',
      '--assistant-tip-right': '16px',
    });
  });

  it('starts counting again when something new is said', () => {
    const { result } = tip();

    say();
    pass(ASSISTANT_TIP.minHoldMs - 1);
    say('Something else.');
    pass(ASSISTANT_TIP.minHoldMs - 1);

    expect(result.current.tip?.text).toBe('Something else.');
  });

  it('goes away at once when clicked', () => {
    const { result } = tip();

    say();
    act(() => {
      result.current.onClick();
    });

    expect(result.current.tip).toBeNull();
  });

  it('does NOT leave while the pointer is on it, and leaves after it moves off', () => {
    const { result } = tip();

    say();
    act(() => {
      result.current.onPointerEnter();
    });
    pass(ASSISTANT_TIP.maxHoldMs * 2);

    expect(result.current.tip).not.toBeNull();

    act(() => {
      result.current.onPointerLeave();
    });
    pass(ASSISTANT_TIP.minHoldMs);

    expect(result.current.tip).toBeNull();
  });

  /** Um clique tira o balão de baixo do ponteiro, e o pointerleave nunca chega. */
  it('does NOT let a tip clicked away hold the next one on the screen', () => {
    const { result } = tip();

    say();
    act(() => {
      result.current.onPointerEnter();
    });
    act(() => {
      result.current.onClick();
    });
    say('The next one.');
    pass(ASSISTANT_TIP.minHoldMs);

    expect(result.current.tip).toBeNull();
  });
});
