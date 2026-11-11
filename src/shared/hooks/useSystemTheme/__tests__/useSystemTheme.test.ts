// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSystemTheme } from '@/shared/hooks/useSystemTheme';
import { useAppStore } from '@/store';

/** Um `matchMedia` fake, que diz se o computador está escuro e avisa quando ele muda. */
function computer(isDark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: isDark,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };

  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;

  return {
    turn: (dark: boolean) => {
      query.matches = dark;
      for (const listener of listeners) listener();
    },
    listeners,
  };
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia');
});

describe('useSystemTheme', () => {
  it('reads whether the computer is dark or light', () => {
    computer(false);
    useAppStore.setState({ systemTheme: 'dark' });

    renderHook(() => {
      useSystemTheme();
    });

    expect(useAppStore.getState().systemTheme).toBe('light');
  });

  it('follows the computer when it turns dark at night, and stops listening when gone', () => {
    const machine = computer(false);
    const { unmount } = renderHook(() => {
      useSystemTheme();
    });

    act(() => {
      machine.turn(true);
    });

    expect(useAppStore.getState().systemTheme).toBe('dark');

    unmount();

    expect(machine.listeners.size).toBe(0);
  });
});
