// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppViewModel } from '@/app/hooks/useAppViewModel';
import { i18n } from '@/languages';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

describe('useAppViewModel', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'dark', screen: 'welcome', projects: [] });
    useSettingsStore.setState({ hasOnboarded: true });
  });

  it('opens on the first-run setup until the QA finished or skipped it', () => {
    useSettingsStore.setState({ hasOnboarded: false });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isOnboarding).toBe(true);
  });

  describe('the window', () => {
    afterEach(() => {
      Reflect.deleteProperty(window, 'qazinho');
    });

    it('opens small while the QA is welcomed, and grows once they are in', () => {
      const fitWindow = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), fitWindow };
      useSettingsStore.setState({ hasOnboarded: false });
      renderHook(() => useAppViewModel());

      expect(fitWindow).toHaveBeenLastCalledWith('onboarding');

      act(() => {
        useSettingsStore.getState().finishOnboarding();
      });

      expect(fitWindow).toHaveBeenLastCalledWith('app');
    });

    it("paints Windows' own window controls in the theme on screen, and leaves the Mac's alone", () => {
      const paintWindowControls = vi.fn(() => Promise.resolve());

      document.documentElement.style.setProperty('--panel', '#121316');
      document.documentElement.style.setProperty('--ink2', '#b1afa7');
      window.qazinho = { ...fakeQazinhoApi('win32'), paintWindowControls };
      renderHook(() => useAppViewModel());

      expect(paintWindowControls).toHaveBeenCalledWith({
        color: '#121316',
        symbolColor: '#b1afa7',
      });

      window.qazinho = { ...fakeQazinhoApi('darwin'), paintWindowControls };
      paintWindowControls.mockClear();
      renderHook(() => useAppViewModel());

      expect(paintWindowControls).not.toHaveBeenCalled();
      document.documentElement.removeAttribute('style');
    });

    it('opens full straight away once the welcome was done', () => {
      const fitWindow = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), fitWindow };
      renderHook(() => useAppViewModel());

      expect(fitWindow).toHaveBeenCalledExactlyOnceWith('app');
    });
  });

  it('does NOT show the setup again once it was done', () => {
    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isOnboarding).toBe(false);
  });

  it('opens on the welcome screen while there is nothing to test', () => {
    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isWelcome).toBe(true);
  });

  it('writes the theme on the document, because the tokens hang off it', () => {
    useAppStore.setState({ theme: 'light' });

    renderHook(() => useAppViewModel());

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('is not the welcome screen once a workspace is open', () => {
    useAppStore.setState({
      screen: 'workspace',
      projects: [{ id: 'p1', name: 'Shop · staging', targets: [], repositories: [] }],
    });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isWelcome).toBe(false);
  });

  it('keeps the welcome screen while there is no project, whatever the screen says', () => {
    useAppStore.setState({ screen: 'workspace', projects: [] });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isWelcome).toBe(true);
  });

  /** With no project, the welcome screen covered Settings, and nothing else led there. */
  it('opens Settings even before the first project', () => {
    useAppStore.setState({ screen: 'settings', projects: [] });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isSettings).toBe(true);
    expect(result.current.isWelcome).toBe(false);
  });

  /**
   * With the device panel shut, the Estagiário's button sat a pixel from the chat's composer,
   * where a click meant for one could land on the other.
   */
  it("makes room beside the Estagiário's button while the device panel is shut, and none once it opens", () => {
    useAppStore.setState({
      screen: 'workspace',
      projects: [{ id: 'p1', name: 'Shop', targets: [], repositories: [] }],
    });
    useWorkspaceStore.setState({ isPanelOpen: false });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.shellStyle).toMatchObject({
      '--dock-room': '42px',
      '--dock-lift': '76px',
    });

    act(() => {
      useWorkspaceStore.setState({ isPanelOpen: true });
    });

    expect(result.current.shellStyle).toMatchObject({ '--dock-room': '0px' });
  });

  /** Settings drew its menu as wide as the sidebar, and a folded sidebar squeezed it a word a line. */
  it('folds only the sidebar: what is drawn as wide as an open one keeps its width', () => {
    useSettingsStore.setState({ isSidebarShut: true });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.shellStyle).toMatchObject({
      '--sidebar-width': '268px',
      '--sidebar-shown': '56px',
    });

    act(() => {
      useSettingsStore.setState({ isSidebarShut: false });
    });

    expect(result.current.shellStyle).toMatchObject({ '--sidebar-shown': '268px' });
  });

  it('hides the app sidebar while settings take the whole window', () => {
    useAppStore.setState({
      screen: 'settings',
      projects: [{ id: 'p1', name: 'Shop · staging', targets: [], repositories: [] }],
    });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isSettings).toBe(true);
    expect(result.current.hasSidebar).toBe(false);
  });

  it("shows a project's suite beside the sidebar, and no workspace with it", () => {
    useAppStore.setState({
      screen: 'automation',
      automationProjectId: 'p1',
      projects: [{ id: 'p1', name: 'Shop · staging', targets: [], repositories: [] }],
    });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current).toMatchObject({
      isAutomation: true,
      hasSidebar: true,
      isWorkspace: false,
      isWelcome: false,
    });
  });

  it('mounts the lightbox only while there is media, so its exit can play', () => {
    useAppStore.setState({ media: null });

    expect(renderHook(() => useAppViewModel()).result.current.hasMedia).toBe(false);

    useAppStore.setState({
      media: { kicker: 'r-01', title: 'step 1', src: null, file: null },
    });

    expect(renderHook(() => useAppViewModel()).result.current.hasMedia).toBe(true);
  });

  /** A new key per opening replays the theater from its start: a take never inherits another's place. */
  it('mounts the replay only while one is open, under a key of its own per opening', () => {
    useAppStore.setState({ replay: null });

    expect(renderHook(() => useAppViewModel()).result.current.hasReplay).toBe(false);

    useAppStore.setState({
      replay: {
        workspaceId: 'w1',
        runId: 'r-01',
        focus: { kind: 'case', caseId: 'TC-02' },
      },
    });

    const casing = renderHook(() => useAppViewModel()).result.current;

    useAppStore.setState({
      replay: {
        workspaceId: 'w1',
        runId: 'r-01',
        focus: { kind: 'bug', bugId: 'BUG-01' },
      },
    });

    const bugging = renderHook(() => useAppViewModel()).result.current;

    expect(casing.hasReplay).toBe(true);
    expect(casing.replayKey).not.toBe(bugging.replayKey);
    useAppStore.setState({ replay: null });
  });

  it('speaks the language the QA picked, and switches as soon as they pick another', async () => {
    useSettingsStore.setState({ language: 'pt' });

    renderHook(() => useAppViewModel());

    await waitFor(() => {
      expect(i18n.language).toBe('pt');
    });

    useSettingsStore.setState({ language: 'en' });

    await waitFor(() => {
      expect(i18n.language).toBe('en');
    });
  });

  it('mounts the notice of a run that ended under its own key, so a second one replaces the first', () => {
    useAppStore.setState({ runNotice: { key: 'k-1', workspaceId: 'w1', runId: 'r-01' } });

    const first = renderHook(() => useAppViewModel()).result.current;

    useAppStore.setState({ runNotice: { key: 'k-2', workspaceId: 'w1', runId: 'r-02' } });

    const second = renderHook(() => useAppViewModel()).result.current;

    expect(first.hasRunNotice).toBe(true);
    expect(first.runNoticeKey).not.toBe(second.runNoticeKey);
    useAppStore.setState({ runNotice: null });

    expect(renderHook(() => useAppViewModel()).result.current.hasRunNotice).toBe(false);
  });
});
