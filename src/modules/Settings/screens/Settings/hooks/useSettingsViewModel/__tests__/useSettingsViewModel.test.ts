// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsViewModel } from '@/modules/Settings/screens/Settings/hooks/useSettingsViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useMachineStore, useSettingsStore } from '@/store';

beforeEach(() => {
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
    expect(result.current.tabs).toHaveLength(7);
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

  it('shows the keys being waited for on the shortcut under edit', () => {
    const { result } = renderHook(() => useSettingsViewModel());

    act(() => {
      result.current.onEditKeybind('run');
    });

    expect(result.current.keybinds.find(({ id }) => id === 'run')?.keys).toBe(
      'press the keys',
    );
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
});
