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

    it('flags an agent found but signed out, and offers to sign it in from here', () => {
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
        badge: '',
        detail: 'needs a sign-in',
        canInstall: false,
        canSignIn: true,
      });
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

    it('offers the sign-in once a fresh install says it is signed out', () => {
      useMachineStore.setState({
        agents: [
          CLAUDE,
          { ...CODEX, isFound: true, path: '/bin/codex', isSignedIn: false },
        ],
      });
      useSetupStore.setState({ installs: { codex: { phase: 'installed' } } });
      const { result } = renderHook(() => useStepAgentsViewModel());

      expect(result.current.rows[1]?.canSignIn).toBe(true);
    });

    it('does NOT offer a sign-in to an agent that is signed in', () => {
      const { result } = renderHook(() => useStepAgentsViewModel());

      expect(result.current.rows[0]).toMatchObject({ canSignIn: false });
    });
  });

  describe('onSignIn', () => {
    it("runs the agent's own sign-in in a popup, and checks the machine again once it is in", async () => {
      useMachineStore.setState({
        agents: [
          CLAUDE,
          { ...CODEX, isFound: true, path: '/bin/codex', isSignedIn: false },
        ],
      });

      const signIn = vi.spyOn(window.qazinho, 'signInAgent');
      const check = vi.spyOn(window.qazinho, 'checkMachine');
      const { result } = renderHook(() => useStepAgentsViewModel());

      await act(async () => {
        result.current.rows[1]?.onSignIn();
      });

      expect(signIn).toHaveBeenCalledWith('codex');
      expect(result.current.signIn).toMatchObject({
        agentId: 'codex',
        phase: 'connected',
      });
      expect(result.current.signInAgent).toBe('Codex');
      expect(check).toHaveBeenCalled();
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
});
