// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFirstRunViewModel } from '@/modules/Home/screens/FirstRun/hooks/useFirstRunViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

const CLAUDE = {
  id: 'claude-code',
  name: 'Claude Code',
  command: 'claude',
  isFound: true,
  path: '/usr/local/bin/claude',
  defaultModel: null,
  isSignedIn: true,
};

const typedApp = (result: { current: ReturnType<typeof useFirstRunViewModel> }) => {
  act(() => {
    result.current.onTypedChange('staging.loja.test');
  });
  act(() => {
    result.current.onContinue();
  });
};

beforeEach(() => {
  window.qazinho = fakeQazinhoApi('darwin');
  useAppStore.setState({
    projects: [],
    screen: 'welcome',
    selectedWorkspaceId: null,
    selectedProjectId: null,
    modal: null,
  });
  useWorkspaceStore.setState({ workspaces: [] });
  useSettingsStore.setState({ agent: 'Claude Code' });
  useMachineStore.setState({ agents: [CLAUDE] });
});

describe('useFirstRunViewModel', () => {
  describe('which app', () => {
    it('asks for the app first, and goes on with a site the QA typed', () => {
      const { result } = renderHook(() => useFirstRunViewModel());

      expect(result.current).toMatchObject({
        isAppStep: true,
        appTitle: 'Which app will you test?',
      });

      typedApp(result);

      expect(result.current).toMatchObject({
        isAppStep: false,
        targetPlace: 'staging.loja.test',
        targetMark: { kind: 'platform', platform: 'web' },
      });
    });

    it('does NOT go on without an app, and says why in words', () => {
      const { result } = renderHook(() => useFirstRunViewModel());

      act(() => {
        result.current.onContinue();
      });

      expect(result.current).toMatchObject({
        isAppStep: true,
        hasProblem: true,
        problem: 'Type the address of the app, or choose a build.',
      });

      act(() => {
        result.current.onTypedChange('not an address');
      });
      act(() => {
        result.current.onContinue();
      });

      expect(result.current.isAppStep).toBe(true);
      expect(result.current.problem).not.toBe('');
    });

    it('takes a build chosen from the disk, named by its file', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        pickFile: () => Promise.resolve('/Users/qa/builds/loja-1.4.apk'),
      };

      const { result } = renderHook(() => useFirstRunViewModel());

      act(() => {
        result.current.onPickApk();
      });
      await waitFor(() => {
        expect(result.current.hasBuild).toBe(true);
      });

      expect(result.current).toMatchObject({
        buildKind: 'android',
        buildName: 'loja-1.4.apk',
      });

      act(() => {
        result.current.onContinue();
      });

      expect(result.current).toMatchObject({
        isAppStep: false,
        targetPlace: 'loja-1.4.apk',
        targetMark: { kind: 'platform', platform: 'android' },
      });
    });

    /** Um .app de simulador só roda num Mac: fora dele, a escolha nem aparece. */
    it('offers an .app only on a Mac', () => {
      expect(renderHook(() => useFirstRunViewModel()).result.current.canPickApp).toBe(
        true,
      );

      window.qazinho = fakeQazinhoApi('win32');

      expect(renderHook(() => useFirstRunViewModel()).result.current.canPickApp).toBe(
        false,
      );
    });
  });

  describe('what to test first', () => {
    it('makes the project and the first plan, and hands what the QA wrote to the agent', () => {
      const askAgent = vi.fn(() => new Promise<never>(() => undefined));

      window.qazinho = { ...fakeQazinhoApi('darwin'), askAgent };

      const { result } = renderHook(() => useFirstRunViewModel());

      typedApp(result);
      act(() => {
        result.current.onAskChange('o cupom de desconto no checkout');
      });
      act(() => {
        result.current.onStart();
      });

      const [project] = useAppStore.getState().projects;
      const [workspace] = useWorkspaceStore.getState().workspaces;

      expect(project).toMatchObject({
        name: 'Loja',
        targets: [{ kind: 'web', value: 'http://staging.loja.test' }],
      });
      expect(workspace).toMatchObject({
        name: 'O cupom de desconto no checkout',
        projectId: project?.id,
      });
      expect(workspace?.chat[0]).toMatchObject({
        kind: 'user',
        text: 'o cupom de desconto no checkout',
      });
      expect(useAppStore.getState()).toMatchObject({
        screen: 'workspace',
        selectedWorkspaceId: workspace?.id,
      });
      expect(askAgent).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'o cupom de desconto no checkout' }),
      );
    });

    it('does NOT start a plan with nothing written', () => {
      const { result } = renderHook(() => useFirstRunViewModel());

      typedApp(result);

      expect(result.current.canStart).toBe(false);

      act(() => {
        result.current.onStart();
      });

      expect(useAppStore.getState().projects).toEqual([]);
    });

    it('fills the field with an example, which the QA can still change', () => {
      const { result } = renderHook(() => useFirstRunViewModel());

      typedApp(result);
      act(() => {
        result.current.examples[0]?.onPick();
      });

      expect(result.current).toMatchObject({
        ask: 'The sign-in and the sign-up',
        canStart: true,
      });
    });

    it('lets the agent explore the app instead of writing a plan', () => {
      const startRun = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), startRun };

      const { result } = renderHook(() => useFirstRunViewModel());

      typedApp(result);
      act(() => {
        result.current.onExplore();
      });

      expect(useWorkspaceStore.getState().workspaces[0]).toMatchObject({
        name: 'Exploration',
      });
      expect(useAppStore.getState().screen).toBe('workspace');
    });

    it('goes back to the app, keeping what the QA typed', () => {
      const { result } = renderHook(() => useFirstRunViewModel());

      typedApp(result);
      act(() => {
        result.current.onBack();
      });

      expect(result.current).toMatchObject({
        isAppStep: true,
        typed: 'staging.loja.test',
      });
    });
  });

  describe('the agent', () => {
    it('says which agent is ready on this machine', () => {
      expect(renderHook(() => useFirstRunViewModel()).result.current).toMatchObject({
        isAgentReady: true,
        agentLine: 'Claude Code is ready on this machine',
      });
    });

    /** Sem agente, o plano não sai: a linha diz isso e leva às Configurações. */
    it('says no agent is ready, and leads to Settings', () => {
      useMachineStore.setState({ agents: [{ ...CLAUDE, isFound: false }] });

      const { result } = renderHook(() => useFirstRunViewModel());

      expect(result.current).toMatchObject({
        isAgentReady: false,
        agentLine: 'No coding agent is ready on this machine yet.',
      });

      act(() => {
        result.current.onSettings();
      });

      expect(useAppStore.getState().screen).toBe('settings');
    });
  });
});
