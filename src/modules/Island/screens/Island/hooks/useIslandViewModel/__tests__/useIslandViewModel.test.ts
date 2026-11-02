// @vitest-environment jsdom
import type { IIslandAction, IIslandFrame, IslandState } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useIslandViewModel } from '@/modules/Island/screens/Island/hooks/useIslandViewModel';

let pushFrame: (frame: IIslandFrame) => void = () => undefined;
let acted: IIslandAction[] = [];
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
      count: '2/8',
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
    expect(result.current.size).toMatchObject({ width: 185 + 120, height: 33 });
  });

  it('hangs as a small pill on a screen with no notch', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame({ ...running, barHeight: 28, notchWidth: 0 });
    });

    expect(result.current.size).toMatchObject({ width: 108, height: 28 });
  });

  it('signals that the agent waits for the QA without opening by itself', () => {
    const { result } = renderHook(() => useIslandViewModel());

    act(() => {
      pushFrame({
        ...NOTCHED,
        island: {
          language: 'en',
          state: {
            kind: 'asking',
            workspaceId: 'w1',
            name: 'Checkout',
            question: 'Which plan should I pick?',
          },
        },
      });
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.size).toMatchObject({ width: 185 + 120, height: 33 });
    expect(result.current.shown).toMatchObject({
      tone: 'asking',
      mood: 'thinking',
      icon: 'attention',
      detail: 'Which plan should I pick?',
      canStop: false,
      openLabel: 'Answer',
    });
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
