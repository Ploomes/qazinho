// @vitest-environment jsdom
import type { IslandAction, IIslandFrame, IslandState } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useIslandViewModel } from '@/modules/Island/screens/Island/hooks/useIslandViewModel';

/** Um quadro com uma pergunta esperando, ou uma para cada texto dado. */
const asking = (...said: string[]): IIslandFrame => ({
  ...NOTCHED,
  island: {
    language: 'en',
    state: {
      kind: 'asking',
      questions: said.map((question) => ({
        workspaceId: 'w1',
        questionId: question,
        project: 'Loja',
        workspace: 'Checkout',
        question,
        options: [],
        isSecret: false,
      })),
    },
  },
});

let pushFrame: (frame: IIslandFrame) => void = () => undefined;
let acted: IslandAction[] = [];
let hovered: boolean[] = [];

beforeEach(async () => {
  await i18n.changeLanguage('en');
  acted = [];
  hovered = [];
  window.qazinhoIsland = {
    onFrame: (listener) => {
      pushFrame = listener;

      return () => undefined;
    },
    hover: (isOver) => {
      hovered.push(isOver);
    },
    keyboard: () => undefined,
    act: (action) => {
      acted.push(action);
    },
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinhoIsland');
});

const NOTCHED = { barHeight: 33, notchWidth: 185 };

const running: IIslandFrame = {
  ...NOTCHED,
  island: {
    language: 'en',
    state: {
      kind: 'running',
      workspaceId: 'w1',
      name: 'Checkout',
      detail: 'Tap Sign in',
      done: 2,
      total: 8,
      isExploring: false,
      isPaused: false,
    },
  },
};

describe('useIslandViewModel', () => {
  it('shows nothing until the main sends a frame', () => {
    const { result } = renderHook(() => useIslandViewModel());

    expect(result.current.shown).toBeNull();
  });

  it('names the run on the ear and, opened, the step it is on', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(running);
    });

    expect(result.current.shown).toMatchObject({
      count: '3/8',
      mood: 'running',
      icon: 'running',
      title: 'Checkout',
      line: 'Running',
      detail: 'Tap Sign in',
      progress: 0.25,
      canStop: true,
    });
  });

  it('is as wide as the notch and its ears, and as tall as the bar, until opened', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(running);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.size).toMatchObject({ width: 185 + 2 * 51, height: 33 });
  });

  it('stays small with just the Estagiário and the icon, and widens when a counter shows', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(asking('Which plan should I pick?'));
    });

    const small = result.current.size.width;

    act(() => {
      pushFrame(running);
    });

    expect(result.current.size.width).toBeGreaterThan(small);
  });

  it('hangs as a small pill on a screen with no notch', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame({ ...running, barHeight: 28, notchWidth: 0 });
    });

    expect(result.current.size).toMatchObject({ width: 102, height: 28 });
  });

  it('signals that the agent waits for the QA without opening by itself', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(asking('Which plan should I pick?'));
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.size).toMatchObject({ width: 185 + 2 * 34, height: 33 });
    expect(result.current.shown).toMatchObject({
      tone: 'asking',
      mood: 'thinking',
      icon: 'attention',
      count: '',
    });
    expect(result.current.ask).toMatchObject({ question: 'Which plan should I pick?' });
  });

  it('counts the questions on the ear when more than one waits, and widens for it', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(asking('Which plan?'));
    });

    const one = result.current.size.width;

    act(() => {
      pushFrame(asking('Which plan?', 'Which size?', 'Which color?'));
    });

    expect(result.current.shown?.count).toBe('3');
    expect(result.current.size.width).toBeGreaterThan(one);
  });

  it('flashes for a question that arrived, and not for one that was answered', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(asking('Which plan?', 'Which size?'));
    });

    expect(result.current.flash).toBe(1);

    act(() => {
      pushFrame(asking('Which size?'));
    });

    expect(result.current.flash).toBe(1);
  });

  it('flashes once when the agent starts waiting, and again for a new question only', () => {
    const { result } = renderHook(() => useIslandViewModel());
    act(() => {
      pushFrame(running);
    });

    expect(result.current.flash).toBe(0);

    act(() => {
      pushFrame(asking('Which plan?'));
    });
    act(() => {
      pushFrame(asking('Which plan?'));
    });

    expect(result.current.flash).toBe(1);

    act(() => {
      pushFrame(asking('Which size?'));
    });

    expect(result.current.flash).toBe(2);
  });

  /**
   * Medida pelo `height: auto` do Motion, com o pill ainda estreito, a altura passava da
   * final e voltava, um flick. Aberta, ela é a barra mais o conteúdo medido na largura dele.
   */
  it('opens as tall as the bar and what the body measures, and closes after', () => {
    let measure = () => undefined as void;

    vi.stubGlobal(
      'ResizeObserver',
      class {
        public constructor(listener: () => void) {
          measure = listener;
        }

        public observe = () => undefined;
        public disconnect = () => undefined;
      },
    );

    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(running);
    });

    result.current.pill.current = {
      getBoundingClientRect: () => ({ left: 90, right: 370, bottom: 33 }),
    } as HTMLDivElement;
    result.current.body.current = { offsetHeight: 150 } as HTMLDivElement;

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 10 }));
    });
    act(() => {
      measure();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.size).toMatchObject({ width: 400, height: 33 + 150 });
    expect(result.current.pillClassName).toContain('island__pill--open');
    expect(hovered).toEqual([true]);

    act(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 10 }));
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.size).toMatchObject({ height: 33 });
    expect(hovered).toEqual([true, false]);
    vi.unstubAllGlobals();
  });

  it('says how a run ended, with the failures first', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame({
        ...NOTCHED,
        island: {
          language: 'en',
          state: {
            kind: 'ended',
            workspaceId: 'w1',
            name: 'Checkout',
            passed: 5,
            failed: 2,
          },
        },
      });
    });

    expect(result.current.shown).toMatchObject({
      icon: 'failed',
      mood: 'bug',
      count: '2',
      line: '5 passed · 2 failed',
    });
  });

  it('lets the Estagiário sleep while a run is paused, and cheer when everything passed', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame({
        ...running,
        island: {
          language: 'en',
          state: {
            ...(running.island.state as Extract<IslandState, { kind: 'running' }>),
            isPaused: true,
          },
        },
      });
    });

    expect(result.current.shown).toMatchObject({ mood: 'sleeping', icon: 'paused' });

    act(() => {
      pushFrame({
        ...NOTCHED,
        island: {
          language: 'en',
          state: {
            kind: 'ended',
            workspaceId: 'w1',
            name: 'Checkout',
            passed: 4,
            failed: 0,
          },
        },
      });
    });

    expect(result.current.shown).toMatchObject({ mood: 'passed', count: '4' });
  });

  it('speaks the language of the QA that the frame carries', async () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame({ ...running, island: { ...running.island, language: 'pt' } });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.shown?.line).toBe('Rodando');
  });

  it('asks the main to open or stop the workspace it shows', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame(running);
    });
    act(() => {
      result.current.onOpen();
      result.current.onStop();
    });

    expect(acted).toEqual([
      { kind: 'open', workspaceId: 'w1' },
      { kind: 'stop', workspaceId: 'w1' },
    ]);
    expect(hovered).toEqual([]);
  });
});
