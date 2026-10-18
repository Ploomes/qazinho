// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStepAgentsViewModel } from '@/modules/Setup/screens/Onboarding/components/StepAgents/hooks/useStepAgentsViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

const CLAUDE = {
  id: 'claude-code',
  name: 'Claude Code',
  command: 'claude',
  isFound: true,
  path: '/bin/claude',
  defaultModel: null,
  isSignedIn: true,
};
const CODEX = {
  ...CLAUDE,
  id: 'codex',
  name: 'Codex',
  command: 'codex',
  isFound: false,
  path: null,
};
const WITH_NPM = {
  npm: { isFound: true, path: '/bin/npm' },
  brew: { isFound: true, path: '/bin/brew' },
};

beforeEach(() => {
  useMachineStore.setState({ agents: [CLAUDE, CODEX] });
  useSetupStore.setState({ managers: WITH_NPM, installs: {}, isChecking: false });
  useSettingsStore.setState({ agent: 'Claude Code', model: '' });
  window.qazinho = fakeQazinhoApi('darwin');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useStepAgentsViewModel', () => {
  describe('rows', () => {
    it('marks the agent in use, and offers to install the one that is missing', () => {
      const { result } = renderHook(() => useStepAgentsViewModel());
      const [claude, codex] = result.current.rows;

      expect(claude).toMatchObject({ isInUse: true, badge: 'in use', canInstall: false });
      expect(codex).toMatchObject({
        state: 'missing',
        canInstall: true,
        detail: 'not on this machine',
      });
    });

    it('flags an agent found but signed out, and says how to sign in', () => {
      useMachineStore.setState({
        agents: [
          CLAUDE,
          { ...CODEX, isFound: true, path: '/bin/codex', isSignedIn: false },
        ],
      });

      const { result } = renderHook(() => useStepAgentsViewModel());
      const codex = result.current.rows[1];

      expect(codex).toMatchObject({
        state: 'missing',
        badge: 'signed out',
        canInstall: false,
      });
      expect(codex?.signIn).toContain('Run codex login in a terminal');
    });

    it('does NOT count a signed-out agent as one QAzinho can work with', () => {
      useMachineStore.setState({ agents: [{ ...CLAUDE, isSignedIn: false }, CODEX] });

      expect(renderHook(() => useStepAgentsViewModel()).result.current.hasAgent).toBe(
        false,
      );
    });

    it('counts an agent that would not say whether it is signed in, rather than block on it', () => {
      useMachineStore.setState({ agents: [{ ...CLAUDE, isSignedIn: null }, CODEX] });

      expect(renderHook(() => useStepAgentsViewModel()).result.current.hasAgent).toBe(
        true,
      );
    });

    it('does NOT offer an install when this machine has no npm, and says what to get', () => {
      useSetupStore.setState({
        managers: { ...WITH_NPM, npm: { isFound: false, path: null } },
      });
      const { result } = renderHook(() => useStepAgentsViewModel());

      expect(result.current.rows[1]?.canInstall).toBe(false);
      expect(result.current.needsNpm).toBe(true);
    });

    it('does NOT offer a second install while one is running', () => {
      useSetupStore.setState({
        installs: { codex: { phase: 'installing', stage: 1, stages: 1, line: '' } },
      });
      const { result } = renderHook(() => useStepAgentsViewModel());

      expect(result.current.rows[1]?.canInstall).toBe(false);
      expect(result.current.rows[1]?.install).toMatchObject({ phase: 'installing' });
    });

    it('tells the QA to sign in once a fresh install is found', () => {
      useMachineStore.setState({
        agents: [CLAUDE, { ...CODEX, isFound: true, path: '/bin/codex' }],
      });
      useSetupStore.setState({ installs: { codex: { phase: 'installed' } } });
      const { result } = renderHook(() => useStepAgentsViewModel());

      expect(result.current.rows[1]?.signIn).toContain('codex');
    });
  });

  describe('onUse', () => {
    it('makes a found agent the one QAzinho drives', () => {
      useMachineStore.setState({
        agents: [CLAUDE, { ...CODEX, isFound: true, path: '/bin/codex' }],
      });
      const { result } = renderHook(() => useStepAgentsViewModel());

      act(() => {
        result.current.rows[1]?.onUse();
      });

      expect(useSettingsStore.getState().agent).toBe('Codex');
    });
  });

  describe('onInstall', () => {
    it('installs the agent behind the row', () => {
      const install = vi.spyOn(window.qazinho, 'installTool');
      const { result } = renderHook(() => useStepAgentsViewModel());

      act(() => {
        result.current.rows[1]?.onInstall();
      });

      expect(install).toHaveBeenCalledWith('codex');
    });
  });

  it('knows when no agent is on this machine at all', () => {
    useMachineStore.setState({ agents: [{ ...CLAUDE, isFound: false, path: null }] });
    const { result } = renderHook(() => useStepAgentsViewModel());

    expect(result.current.hasAgent).toBe(false);
  });
});
