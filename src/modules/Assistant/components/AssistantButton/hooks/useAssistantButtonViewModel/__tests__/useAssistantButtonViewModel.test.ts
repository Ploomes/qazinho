// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAssistantButtonViewModel } from '@/modules/Assistant/components/AssistantButton/hooks/useAssistantButtonViewModel';
import { KEYBINDS } from '@/modules/Settings/constants';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAssistantStore, useSettingsStore } from '@/store';

beforeEach(() => {
  useSettingsStore.setState({ language: 'en', keybinds: KEYBINDS });
  useAssistantStore.setState({ isOpen: false, isAsking: false, unread: 0, tip: null });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useAssistantButtonViewModel', () => {
  describe('onClick', () => {
    it('opens the chat, and shuts it again', () => {
      const { result } = renderHook(() => useAssistantButtonViewModel());

      act(() => {
        result.current.onClick();
      });

      expect(result.current).toMatchObject({
        isOpen: true,
        label: "Close the Intern's chat",
        className: 'assistant-button assistant-button--open',
      });

      act(() => {
        result.current.onClick();
      });

      expect(useAssistantStore.getState().isOpen).toBe(false);
    });

    it('clears the count of new answers once opened', () => {
      useAssistantStore.setState({ unread: 2 });

      const { result } = renderHook(() => useAssistantButtonViewModel());

      act(() => {
        result.current.onClick();
      });

      expect(useAssistantStore.getState().unread).toBe(0);
      expect(result.current.badge).toBeNull();
    });
  });

  it('thinks out loud while the assistant works, and holds still otherwise', () => {
    useAssistantStore.setState({ isAsking: true });

    const { result } = renderHook(() => useAssistantButtonViewModel());

    expect(result.current).toMatchObject({
      mood: 'thinking',
      isStill: false,
      isBusy: true,
    });

    act(() => {
      useAssistantStore.setState({ isAsking: false });
    });

    expect(result.current).toMatchObject({
      mood: 'neutral',
      isStill: true,
      isBusy: false,
    });
  });

  it('counts the answers that came while the chat was shut', () => {
    useAssistantStore.setState({ unread: 3 });

    const { result } = renderHook(() => useAssistantButtonViewModel());

    expect(result.current).toMatchObject({
      badge: '3',
      badgeLabel: '3 new answers',
      mood: 'passed',
    });
  });

  it('names the shortcut that opens it, and does NOT invent one the QA removed', () => {
    window.qazinho = fakeQazinhoApi('darwin');

    const { result } = renderHook(() => useAssistantButtonViewModel());

    expect(result.current.tip).toBe('Talk to the Intern · ⌘J');

    act(() => {
      useSettingsStore.setState({ keybinds: [] });
    });

    expect(result.current.tip).toBe('Talk to the Intern');
  });

  it('names the shortcut with Ctrl on Windows', () => {
    window.qazinho = fakeQazinhoApi('win32');

    expect(renderHook(() => useAssistantButtonViewModel()).result.current.tip).toBe(
      'Talk to the Intern · Ctrl+J',
    );
  });
});
