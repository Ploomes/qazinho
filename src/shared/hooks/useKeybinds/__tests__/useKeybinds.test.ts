// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useKeybinds } from '@/shared/hooks/useKeybinds';
import { useAppStore, useWorkspaceStore } from '@/store';

function press(props: { key: string; isHandled: boolean }) {
  const event = new KeyboardEvent('keydown', {
    key: props.key,
    metaKey: true,
    bubbles: true,
    cancelable: true,
  });

  if (props.isHandled) event.preventDefault();
  window.dispatchEvent(event);
}

beforeEach(() => {
  useWorkspaceStore.setState({ panelTab: 'runs' });
  useAppStore.setState({ dock: null });
});

afterEach(() => {
  cleanup();
});

describe('useKeybinds', () => {
  it('acts on a shortcut pressed anywhere', () => {
    renderHook(() => {
      useKeybinds();
    });

    press({ key: '2', isHandled: false });

    expect(useWorkspaceStore.getState().panelTab).toBe('plan');
  });

  /** O ⌘↵ no chat mandava a mensagem e rodava o plano inteiro também. */
  it('does NOT act on a key a field already took', () => {
    renderHook(() => {
      useKeybinds();
    });

    press({ key: '2', isHandled: true });

    expect(useWorkspaceStore.getState().panelTab).toBe('runs');
  });

  /** Encostada ao Chrome, a janela só mostra o caso: o ⌘↵ marca o passo, não roda o plano. */
  it('does NOT act while the window is docked beside the Chrome of a manual case', () => {
    useAppStore.setState({ dock: { workspaceId: 'w1' } });
    renderHook(() => {
      useKeybinds();
    });

    press({ key: '2', isHandled: false });

    expect(useWorkspaceStore.getState().panelTab).toBe('runs');
  });
});
