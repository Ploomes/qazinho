// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useSettingsViewModel } from '@/modules/Settings/screens/Settings/hooks/useSettingsViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useMachineStore, useSettingsStore, useSetupStore } from '@/store';

beforeEach(() => {
  useSetupStore.setState({ managers: null, isChecking: false, installs: {} });
  useAppStore.setState({ theme: 'dark' });
  useSettingsStore.setState({
    tab: 'agents',
    agent: 'Claude Code',
    model: 'sonnet',
    editingKeybindId: null,
  });
});

/** An agent found on the machine, the way AgentDetector reports it. */
function agent(props: { id: string; name: string }) {
  return {
    ...props,
    command: props.id,
    isFound: true,
    path: `/bin/${props.id}`,
    defaultModel: null,
    isSignedIn: true,
  };
}

describe('useSettingsViewModel', () => {
  it('opens on the agents panel, because nothing runs without one', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.tab).toBe('agents');
    expect(result.current.tabs.map(({ id }) => id)).toEqual([
      'agents',
      'devices',
      'integrations',
      'mcps',
      'appearance',
      'shortcuts',
      'about',
    ]);
  });

  it('names the default agent and offers the other one', () => {
    useMachineStore.setState({
      agents: [
        agent({ id: 'claude-code', name: 'Claude Code' }),
        agent({ id: 'codex', name: 'Codex' }),
      ],
    });

    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.agents.map(({ note }) => note)).toEqual([
      'Default agent',
      'Make default',
    ]);
  });

  it('flags an agent that is there but signed out, and offers to sign it in from here', () => {
    useMachineStore.setState({
      agents: [
        agent({ id: 'claude-code', name: 'Claude Code' }),
        { ...agent({ id: 'codex', name: 'Codex' }), isSignedIn: false },
      ],
    });

    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.agents[1]).toMatchObject({
      note: 'Not signed in',
      canSignIn: true,
      className: 'settings__card settings__card--signed-out',
    });
    expect(result.current.agents[0]).toMatchObject({
      canSignIn: false,
      className: 'settings__card settings__card--on',
    });
  });

  it('flags an agent that is not on PATH', () => {
    useMachineStore.setState({
      agents: [
        agent({ id: 'claude-code', name: 'Claude Code' }),
        { ...agent({ id: 'codex', name: 'Codex' }), isFound: false, path: null },
      ],
    });

    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.agents.map(({ note }) => note)).toEqual([
      'Default agent',
      'Not on PATH',
    ]);
    expect(result.current.agents[1]?.path).toBe('not found');
  });

  it('offers GitHub and Jira as trackers to connect', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.integrations.map(({ id }) => id)).toEqual(['github', 'jira']);
  });

  /** About used to say 0.1.0 whatever build it was. */
  it('shows the version the app was built as', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.version).toBe(`version ${__QAZINHO_VERSION__}`);
    expect(result.current.version).toMatch(/^version \d+\.\d+\.\d+/);
  });

  /** QAzinho is closed source: About once said MIT, and linked into a repository users cannot open. */
  it('says whose app it is, all rights reserved, and nothing of an open licence', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.rights).toBe(
      `© ${String(new Date().getFullYear())} Salve Software. All rights reserved.`,
    );
    expect(result.current.version).not.toContain('MIT');
    expect(result.current).not.toHaveProperty('links');
  });

  it('names every shortcut in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useSettingsViewModel());

    expect(result.current.keybinds.find(({ id }) => id === 'run')?.label).toBe(
      'Rodar o plano',
    );
    await i18n.changeLanguage('en');
  });

  it('shows the keys being waited for on the shortcut under edit', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    act(() => {
      result.current.onEditKeybind('run');
    });

    expect(result.current.keybinds.find(({ id }) => id === 'run')?.keys).toBe(
      'press the keys',
    );
  });

  /** The first run promises an agent can be installed later in Settings, and Settings could not. */
  describe('installing an agent', () => {
    afterEach(() => {
      Reflect.deleteProperty(window, 'qazinho');
      useSetupStore.setState({ managers: null, installs: {} });
      useMachineStore.setState({ agents: [] });
    });

    it('offers to install an agent that is missing when npm is there', () => {
      window.qazinho = fakeQazinhoApi('darwin');
      useMachineStore.setState({
        agents: [
          { ...agent({ id: 'codex', name: 'Codex' }), isFound: false, path: null },
        ],
      });
      useSetupStore.setState({
        managers: {
          npm: { isFound: true, path: '/bin/npm' },
          brew: { isFound: true, path: '/bin/brew' },
        },
      });

      const { result } = renderHook(() => useSettingsViewModel());

      expect(result.current.agents[0]?.canInstall).toBe(true);
      expect(result.current.needsNpm).toBe(false);
    });

    it('does NOT offer it without npm, and says npm comes first', () => {
      window.qazinho = fakeQazinhoApi('darwin');
      useMachineStore.setState({
        agents: [
          { ...agent({ id: 'codex', name: 'Codex' }), isFound: false, path: null },
        ],
      });
      useSetupStore.setState({
        managers: {
          npm: { isFound: false, path: null },
          brew: { isFound: true, path: '/bin/brew' },
        },
      });

      const { result } = renderHook(() => useSettingsViewModel());

      expect(result.current.agents[0]?.canInstall).toBe(false);
      expect(result.current.needsNpm).toBe(true);
    });

    it('does NOT offer to install an agent that is already here', () => {
      window.qazinho = fakeQazinhoApi('darwin');
      useMachineStore.setState({ agents: [agent({ id: 'codex', name: 'Codex' })] });
      useSetupStore.setState({
        managers: {
          npm: { isFound: true, path: '/bin/npm' },
          brew: { isFound: true, path: '/bin/brew' },
        },
      });

      expect(
        renderHook(() => useSettingsViewModel()).result.current.agents[0]?.canInstall,
      ).toBe(false);
    });
  });

  /** The devices tab told a QA missing idb to type "brew install idb-companion". */
  describe('installing idb', () => {
    afterEach(() => {
      Reflect.deleteProperty(window, 'qazinho');
      useSetupStore.setState({ managers: null, installs: {} });
    });

    it('checks the machine when the devices tab opens, so it knows whether brew is there', async () => {
      const checkMachine = vi.fn(fakeQazinhoApi('darwin').checkMachine);

      // A check an earlier test started may still land; let it, then start from nothing.
      await new Promise((later) => setTimeout(later, 0));
      useSetupStore.setState({ managers: null, isChecking: false });

      window.qazinho = { ...fakeQazinhoApi('darwin'), checkMachine };
      useSettingsStore.setState({ tab: 'devices' });
      renderHook(() => useSettingsViewModel());

      await waitFor(() => {
        expect(useSetupStore.getState().managers).not.toBeNull();
      });
      expect(checkMachine).toHaveBeenCalledOnce();
    });

    it('offers to install idb when it is missing and brew is there, instead of a command', () => {
      window.qazinho = fakeQazinhoApi('darwin');
      useSetupStore.setState({
        managers: {
          npm: { isFound: true, path: '/bin/npm' },
          brew: { isFound: true, path: '/bin/brew' },
        },
      });

      const { result } = renderHook(() => useSettingsViewModel());
      const idb = result.current.devices.find(({ name }) => name === 'idb');

      expect(idb?.canInstall).toBe(true);
      expect(idb?.path).not.toContain('brew install');
      expect(result.current.needsBrew).toBe(false);
    });

    it('does NOT offer it without brew, and says brew comes first', () => {
      window.qazinho = fakeQazinhoApi('darwin');
      useSetupStore.setState({
        managers: {
          npm: { isFound: true, path: '/bin/npm' },
          brew: { isFound: false, path: null },
        },
      });

      const { result } = renderHook(() => useSettingsViewModel());

      expect(result.current.devices.find(({ name }) => name === 'idb')?.canInstall).toBe(
        false,
      );
      expect(result.current.needsBrew).toBe(true);
    });
  });

  describe('signing an agent in', () => {
    afterEach(() => {
      Reflect.deleteProperty(window, 'qazinho');
    });

    it("runs that agent's own sign-in in the popup", async () => {
      window.qazinho = fakeQazinhoApi('darwin');
      useMachineStore.setState({
        agents: [{ ...agent({ id: 'codex', name: 'Codex' }), isSignedIn: false }],
      });

      const signIn = vi.spyOn(window.qazinho, 'signInAgent');
      const { result } = renderHook(() => useSettingsViewModel());

      await act(async () => {
        result.current.agents[0]?.onSignIn();
      });

      expect(signIn).toHaveBeenCalledWith('codex');
      expect(result.current.signIn).toMatchObject({
        agentId: 'codex',
        phase: 'connected',
      });
      expect(result.current.signInAgent).toBe('Codex');
    });
  });

  describe('onSelectAgent', () => {
    it('moves to the agent it was given, on that agent own default model', () => {
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onSelectAgent('Codex');
      });

      expect(useSettingsStore.getState()).toMatchObject({ agent: 'Codex', model: '' });
    });

    it('does NOT touch the model when the agent already in use is picked again', () => {
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onSelectAgent('Claude Code');
      });

      expect(useSettingsStore.getState().model).toBe('sonnet');
    });
  });

  describe('onBack', () => {
    it('returns to the workspace that was open before settings', () => {
      useAppStore.setState({ screen: 'settings', selectedWorkspaceId: 'w1' });
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onBack();
      });

      expect(useAppStore.getState().screen).toBe('workspace');
    });

    it('returns to the welcome screen when no workspace was open', () => {
      useAppStore.setState({ screen: 'settings', selectedWorkspaceId: null });
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onBack();
      });

      expect(useAppStore.getState().screen).toBe('welcome');
    });
  });

  describe('onSelectTheme', () => {
    it('switches the theme the whole window reads from', () => {
      const { result } = renderHook(() => useSettingsViewModel());

      act(() => {
        result.current.onSelectTheme('light');
      });

      expect(useAppStore.getState().theme).toBe('light');
    });
  });

  describe('onSelectRunAlert', () => {
    it('calls the QA back with a notification by default, and keeps it inside the app once asked', () => {
      useSettingsStore.setState({ runAlert: 'system' });

      const { result } = renderHook(() => useSettingsViewModel());

      expect(
        result.current.runAlerts.map(({ id, className }) => [id, className]),
      ).toEqual([
        ['system', 'settings__choice settings__choice--on'],
        ['app', 'settings__choice'],
      ]);

      act(() => {
        result.current.onSelectRunAlert('app');
      });

      expect(useSettingsStore.getState().runAlert).toBe('app');
      expect(result.current.runAlerts[1]?.className).toBe(
        'settings__choice settings__choice--on',
      );
    });
  });

  describe('the log', () => {
    afterEach(() => {
      Reflect.deleteProperty(window, 'qazinho');
      vi.useRealTimers();
    });

    it('opens the folder the log is kept in', () => {
      const openLogs = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), openLogs };
      renderHook(() => useSettingsViewModel()).result.current.onOpenLogs();

      expect(openLogs).toHaveBeenCalledOnce();
    });

    it('says it copied the diagnostics for a moment, then offers it again', async () => {
      vi.useFakeTimers();
      window.qazinho = fakeQazinhoApi('darwin');

      const { result } = renderHook(() => useSettingsViewModel());

      expect(result.current.copyDiagnosticsLabel).toBe('Copy diagnostics');

      await act(async () => {
        await result.current.onCopyDiagnostics();
      });

      expect(result.current.copyDiagnosticsLabel).toBe('Copied');

      act(() => {
        vi.advanceTimersByTime(2_000);
      });

      expect(result.current.copyDiagnosticsLabel).toBe('Copy diagnostics');
    });

    it('does NOT say it copied when nothing was', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        copyDiagnostics: () => Promise.resolve(false),
      };

      const { result } = renderHook(() => useSettingsViewModel());

      await act(async () => {
        await result.current.onCopyDiagnostics();
      });

      expect(result.current.copyDiagnosticsLabel).toBe('Copy diagnostics');
    });
  });
});
