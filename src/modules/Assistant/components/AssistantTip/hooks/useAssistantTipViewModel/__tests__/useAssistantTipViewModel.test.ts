// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSISTANT_TIP } from '@/modules/Assistant/components/AssistantTip/constants';
import { useAssistantTipViewModel } from '@/modules/Assistant/components/AssistantTip/hooks/useAssistantTipViewModel';
import { holdMsOf } from '@/modules/Assistant/components/AssistantTip/library';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { SPEECH } from '@/shared/components/molecules/SpeechBubble/constants';
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

    pass(holdMsOf(LINE) - 1);

    expect(result.current.tip).not.toBeNull();

    pass(1);

    expect(result.current.tip).toBeNull();
  });

  it('waits for the bubble to land, then types the line with its whole shape kept', () => {
    const { result } = tip();

    say();

    expect(result.current).toMatchObject({ said: '', unsaid: LINE });

    pass(ASSISTANT_TIP.speakAfterMs + SPEECH.beatMs);

    expect(result.current.said).toBe(LINE.slice(0, SPEECH.charsPerBeat));
    expect(result.current.said + result.current.unsaid).toBe(LINE);

    pass(LINE.length * SPEECH.beatMs);

    expect(result.current).toMatchObject({ said: LINE, unsaid: '' });
  });

  /**
   * O rabo fica no meio do rosto, e o balão passa um pouco da borda dele: alinhado à borda, o
   * rabo caía em cima da curva do canto.
   */
  it('sits under the face with its tail on the middle of it', () => {
    const { result } = tip();

    say();

    expect(result.current.style).toMatchObject({
      '--assistant-tip-top': '46px',
      '--assistant-tip-right': `${String(16 - ASSISTANT_TIP.overhang)}px`,
      '--assistant-tip-tail-right': `${String(ASSISTANT_TIP.overhang + (ASSISTANT_DOCK.buttonSize - ASSISTANT_TIP.tail) / 2)}px`,
    });
  });

  it('never leaves the window when the face is at its edge', () => {
    vi.stubGlobal('innerWidth', 986);

    const { result } = tip();

    say();

    expect(result.current.style).toMatchObject({
      '--assistant-tip-right': '0px',
      '--assistant-tip-tail-right': `${String(2 + (ASSISTANT_DOCK.buttonSize - ASSISTANT_TIP.tail) / 2)}px`,
    });
  });

  it('starts counting again when something new is said', () => {
    const { result } = tip();

    say();
    pass(holdMsOf(LINE) - 1);
    say('Something else.');
    pass(holdMsOf('Something else.') - 1);

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
    pass(holdMsOf(LINE));

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
    pass(holdMsOf('The next one.'));

    expect(result.current.tip).toBeNull();
  });
});
