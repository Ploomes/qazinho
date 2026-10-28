// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAssistantDockViewModel } from '@/modules/Assistant/components/AssistantDock/hooks/useAssistantDockViewModel';
import { PROJECT } from '@/modules/Assistant/library/__tests__/fixtures';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
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
   * O chat abria sobre o dispositivo, cobrindo a tela viva de uma run e os controles
   * dela: a evidência nunca fica sob um sticker.
   */
  it('opens the chat beside the panel while it shows a run live, never over its screen', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    useAppStore.setState({
      screen: 'workspace',
      projects: [PROJECT],
      selectedWorkspaceId: 'w1',
    });
    useWorkspaceStore.setState({
      workspaces: [walkRun({ verdicts: [] })],
      isPanelOpen: true,
      panelTab: 'device',
      panelWidth: 470,
    });

    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.style).toMatchObject({ '--assistant-panel-shift': '475px' });

    act(() => {
      useWorkspaceStore.setState({ isPanelOpen: false });
    });

    expect(result.current.style).toMatchObject({ '--assistant-panel-shift': '0px' });
  });

  /**
   * Quando o painel passou a guardar o plano e os bugs também, ir para o lado punha o
   * chat no meio da tela.
   */
  it('does NOT move aside for a device with no run going', () => {
    useAppStore.setState({
      screen: 'workspace',
      projects: [PROJECT],
      selectedWorkspaceId: 'w1',
    });
    useWorkspaceStore.setState({
      workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
      isPanelOpen: true,
      panelTab: 'device',
      panelWidth: 470,
    });

    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.style).toMatchObject({ '--assistant-panel-shift': '0px' });
  });

  it('does NOT move aside for the plan, the runs or the bugs: it opens in its corner', () => {
    useAppStore.setState({ screen: 'workspace', projects: [PROJECT] });
    useWorkspaceStore.setState({ isPanelOpen: true, panelTab: 'bugs', panelWidth: 470 });

    const { result } = renderHook(() => useAssistantDockViewModel());

    expect(result.current.style).toMatchObject({ '--assistant-panel-shift': '0px' });
  });

  it('does NOT move off a workspace, where no device shows', () => {
    useAppStore.setState({ screen: 'settings', projects: [PROJECT] });
    useWorkspaceStore.setState({
      isPanelOpen: true,
      panelTab: 'device',
      panelWidth: 470,
    });

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
