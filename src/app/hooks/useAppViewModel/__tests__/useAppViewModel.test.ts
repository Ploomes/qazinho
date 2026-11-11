// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppViewModel } from '@/app/hooks/useAppViewModel';
import { i18n } from '@/languages';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace, WALKED_BY } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { NO_UPDATE } from '@/services/Updates';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useUpdateStore,
  useWorkspaceStore,
} from '@/store';

describe('useAppViewModel', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'dark', screen: 'welcome', projects: [] });
    useSettingsStore.setState({ hasOnboarded: true });
  });

  describe('when this version must be updated', () => {
    const required = () => {
      useUpdateStore.setState({ update: { phase: 'idle', isRequired: true } });
    };

    afterEach(() => {
      useUpdateStore.setState({ update: NO_UPDATE });
      useWorkspaceStore.setState({ workspaces: [] });
    });

    it('takes over the window, with a bare title bar', () => {
      required();

      const { result } = renderHook(() => useAppViewModel());

      expect(result.current.isUpdateBlocked).toBe(true);
      expect(result.current.isTitlebarBare).toBe(true);
    });

    // A trava chega no meio do trabalho: a run termina antes, e a evidência dela fica.
    it('waits for a run that is going', () => {
      required();
      useWorkspaceStore.setState({
        workspaces: [
          startRun({
            workspace: makeWorkspace(),
            startedAt: '10:00',
            runId: 'r-01',
            by: WALKED_BY,
          }),
        ],
      });

      const { result } = renderHook(() => useAppViewModel());

      expect(result.current.isUpdateBlocked).toBe(false);
    });

    it('stays out of the way while an update is only optional', () => {
      useUpdateStore.setState({
        update: { phase: 'ready', version: '0.2.0', isRequired: false },
      });

      const { result } = renderHook(() => useAppViewModel());

      expect(result.current.isUpdateBlocked).toBe(false);
      expect(result.current.isTitlebarBare).toBe(false);
    });
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

  it('opens on the first run while there is nothing to test', () => {
    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isFirstRun).toBe(true);
  });

  it('writes the theme on the document, because the tokens hang off it', () => {
    useAppStore.setState({ theme: 'light' });

    renderHook(() => useAppViewModel());

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('is not the first run once a workspace is open', () => {
    useAppStore.setState({
      screen: 'workspace',
      projects: [{ id: 'p1', name: 'Shop · staging', targets: [], repositories: [] }],
    });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isFirstRun).toBe(false);
  });

  it('keeps the first run while there is no project, whatever the screen says', () => {
    useAppStore.setState({ screen: 'workspace', projects: [] });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isFirstRun).toBe(true);
  });

  /**
   * Sem projeto, a tela de boas-vindas cobria as Configurações, e nada mais levava até
   * elas.
   */
  it('opens Settings even before the first project', () => {
    useAppStore.setState({ screen: 'settings', projects: [] });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isSettings).toBe(true);
    expect(result.current.isFirstRun).toBe(false);
  });

  /**
   * As Configurações desenhavam o menu tão largo quanto a sidebar, e uma sidebar dobrada
   * o espremia a uma palavra por linha.
   */
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

  it('mounts the lightbox only while there is media, so its exit can play', () => {
    useAppStore.setState({ media: null });

    expect(renderHook(() => useAppViewModel()).result.current.hasMedia).toBe(false);

    useAppStore.setState({
      media: { kicker: 'r-01', title: 'step 1', src: null, file: null },
    });

    expect(renderHook(() => useAppViewModel()).result.current.hasMedia).toBe(true);
  });

  /**
   * Uma key nova a cada abertura refaz o teatro desde o começo: uma gravação nunca herda
   * o ponto de outra.
   */
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

  it('holds back the warning before a run while the merge it asked for is open', () => {
    useProStore.setState({
      heldRun: { workspaceId: 'w1', mode: 'agent' },
      merging: 'p1',
    });

    expect(renderHook(() => useAppViewModel()).result.current.hasHeldRun).toBe(false);

    act(() => {
      useProStore.setState({ merging: null });
    });

    expect(renderHook(() => useAppViewModel()).result.current.hasHeldRun).toBe(true);
    useProStore.setState({ heldRun: null });
  });
});
