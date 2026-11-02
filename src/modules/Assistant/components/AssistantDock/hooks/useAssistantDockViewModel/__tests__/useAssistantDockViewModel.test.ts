// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAssistantDockViewModel } from '@/modules/Assistant/components/AssistantDock/hooks/useAssistantDockViewModel';
import { useAppStore, useAssistantStore } from '@/store';

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

  it('hands the stylesheet its geometry, in pixels', () => {
    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.style).toEqual({
      '--assistant-panel-width': '384px',
      '--assistant-panel-height': '600px',
      '--assistant-top': '54px',
      '--assistant-inset': '20px',
    });
  });
});
