// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useKeybinds } from '@/shared/hooks/useKeybinds';
import { useWorkspaceStore } from '@/store';

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
  useWorkspaceStore.setState({ tab: 'chat' });
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

    expect(useWorkspaceStore.getState().tab).toBe('plan');
  });

  /** ⌘↵ in the chat sent the message and ran the whole plan too. */
  it('does NOT act on a key a field already took', () => {
    renderHook(() => {
      useKeybinds();
    });

    press({ key: '2', isHandled: true });

    expect(useWorkspaceStore.getState().tab).toBe('chat');
  });
});
