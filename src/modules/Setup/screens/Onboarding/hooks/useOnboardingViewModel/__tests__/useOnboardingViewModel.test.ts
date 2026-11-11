// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnboardingViewModel } from '@/modules/Setup/screens/Onboarding/hooks/useOnboardingViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

const CODEX = {
  id: 'codex',
  name: 'Codex',
  command: 'codex',
  isFound: true,
  path: '/bin/codex',
  defaultModel: null,
  isSignedIn: true,
};

beforeEach(() => {
  useSettingsStore.setState({ hasOnboarded: false, agent: 'Claude Code', model: '' });
  useSetupStore.setState({ integrations: [], managers: null, isChecking: false });
  useMachineStore.setState({ agents: [] });
  window.qazinho = fakeQazinhoApi('darwin');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

function walkTo(
  result: { current: ReturnType<typeof useOnboardingViewModel> },
  steps: number,
) {
  for (let count = 0; count < steps; count += 1)
    act(() => {
      result.current.onNext();
    });
}

describe('useOnboardingViewModel', () => {
  it('opens on the language, and looks at the machine once on the way in', async () => {
    const check = vi.spyOn(window.qazinho, 'checkMachine');
    const { result, rerender } = renderHook(() => useOnboardingViewModel());

    rerender();

    expect(result.current).toMatchObject({
      step: 'welcome',
      isFirst: true,
      title: 'Which language do we speak?',
    });
    expect(result.current.lead).toContain('the Intern');
    await waitFor(() => {
      expect(check).toHaveBeenCalledOnce();
    });
  });

  describe('the question of each step', () => {
    it('says iOS cannot be tested on the devices step of a machine that is not a Mac', () => {
      window.qazinho = fakeQazinhoApi('linux');
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 2);

      expect(result.current.title).toBe('And on a phone?');
      expect(result.current.lead).toContain('iOS only runs on a Mac.');
    });

    it('tells a Mac with every tool that iOS is ready', async () => {
      const tools = {
        androidSdk: { isFound: true, path: '/sdk' },
        xcode: { isFound: true, path: '/Applications/Xcode.app' },
        idb: { isFound: true, path: '/bin/idb' },
      };

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        checkMachine: () =>
          Promise.resolve({
            agents: [],
            tools,
            managers: {
              npm: { isFound: true, path: '/bin/npm' },
              brew: { isFound: true, path: '/bin/brew' },
            },
          }),
      };
      const { result } = renderHook(() => useOnboardingViewModel());

      await waitFor(() => {
        expect(useMachineStore.getState().tools).toEqual(tools);
      });
      walkTo(result, 2);

      expect(result.current.lead).toBe(
        'The web needs nothing else. Android is ready. So is iOS.',
      );
    });

    it('owns up when there is no agent on this machine, looking suspicious', async () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 1);

      await waitFor(() => {
        expect(result.current.lead).toBe('No coding agent is ready on this machine yet.');
      });
      expect(result.current.mood).toBe('flaky');
    });

    it('does NOT count a signed-out agent as one to test with', async () => {
      useMachineStore.setState({ agents: [{ ...CODEX, isSignedIn: false }] });
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 1);

      await waitFor(() => {
        expect(result.current.nextLabel).toBe('Continue without an agent');
      });
    });

    /** Um agente que não diz se entrou não trava a configuração: ele conta. */
    it('counts an agent that would not say whether it is signed in', () => {
      useMachineStore.setState({ agents: [{ ...CODEX, isSignedIn: null }] });
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 1);

      expect(result.current.lead).toBe(
        'The coding agent you already use on this machine.',
      );
    });

    it('asks for the trackers last, saying they can wait', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 3);

      expect(result.current).toMatchObject({
        step: 'integrations',
        title: 'Connect GitHub and Jira?',
        lead: 'You can do it later, in Settings.',
      });
    });
  });

  describe('nextLabel', () => {
    it('says the QA goes on without an agent when none is here', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 1);

      expect(result.current.nextLabel).toBe('Continue without an agent');
    });

    it('just goes on past the trackers, connected or not', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 3);

      expect(result.current.nextLabel).toBe('Continue');
    });
  });

  describe('onNext', () => {
    it('switches to an agent that is here when the one picked is not', () => {
      useMachineStore.setState({ agents: [CODEX] });
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 2);

      expect(useSettingsStore.getState().agent).toBe('Codex');
    });

    it('does NOT change an agent the QA picked that is here', () => {
      useMachineStore.setState({
        agents: [CODEX, { ...CODEX, id: 'claude-code', name: 'Claude Code' }],
      });
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 2);

      expect(useSettingsStore.getState().agent).toBe('Claude Code');
    });

    /** Depois dos trackers vem a pergunta pelo primeiro app, no mesmo jeito: não há tela de fim. */
    it('finishes the setup past the last step, and never shows it again', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 3);

      expect(useSettingsStore.getState().hasOnboarded).toBe(false);

      walkTo(result, 1);

      expect(useSettingsStore.getState().hasOnboarded).toBe(true);
    });
  });

  describe('onBack', () => {
    it('goes back one step, and never before the first', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 2);
      act(() => {
        result.current.onBack();
      });

      expect(result.current.step).toBe('agents');

      act(() => {
        result.current.onBack();
      });
      act(() => {
        result.current.onBack();
      });

      expect(result.current).toMatchObject({ step: 'welcome', isFirst: true });
    });
  });

  describe('onSkipAll', () => {
    it('never shows again once skipped', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      act(() => {
        result.current.onSkipAll();
      });

      expect(useSettingsStore.getState().hasOnboarded).toBe(true);
    });
  });
});
