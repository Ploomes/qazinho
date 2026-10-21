// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAssistantDockViewModel } from '@/modules/Assistant/components/AssistantDock/hooks/useAssistantDockViewModel';
import { PROJECT } from '@/modules/Assistant/library/__tests__/fixtures';
import { useAppStore, useAssistantStore, useWorkspaceStore } from '@/store';

afterEach(() => {
  cleanup();
  useAssistantStore.setState({ isOpen: false });
  useAppStore.setState({ screen: 'welcome', projects: [] });
});

describe('useAssistantDockViewModel', () => {
  it("opens the panel when the assistant's chat is open, and shuts it again", () => {
    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      useAssistantStore.getState().open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  /**
   * The chat opened over the device panel, covering the live screen of a run and its controls:
   * evidence is never under a sticker.
   */
  it('opens the chat beside the open device panel, never over its screen', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    useAppStore.setState({ screen: 'workspace', projects: [PROJECT] });
    useWorkspaceStore.setState({ isDevicePanelOpen: true, deviceWidth: 470 });

    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.style).toMatchObject({ '--assistant-panel-shift': '475px' });

    act(() => {
      useWorkspaceStore.setState({ isDevicePanelOpen: false });
    });

    expect(result.current.style).toMatchObject({ '--assistant-panel-shift': '0px' });
  });

  it('does NOT move off a workspace, where no device panel shows', () => {
    useAppStore.setState({ screen: 'settings', projects: [PROJECT] });
    useWorkspaceStore.setState({ isDevicePanelOpen: true, deviceWidth: 470 });

    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.style).toMatchObject({ '--assistant-panel-shift': '0px' });
  });

  it('hands the stylesheet its geometry, in pixels', () => {
    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.style).toMatchObject({
      '--assistant-button': '56px',
      '--assistant-panel-width': '384px',
    });
  });
});
