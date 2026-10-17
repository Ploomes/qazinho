// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnboardingViewModel } from '@/modules/Setup/screens/Onboarding/hooks/useOnboardingViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useMachineStore, useSettingsStore, useSetupStore } from '@/store';

const CODEX = {
  id: 'codex',
  name: 'Codex',
  command: 'codex',
  isFound: true,
  path: '/bin/codex',
  defaultModel: null,
};

beforeEach(() => {
  useSettingsStore.setState({ hasOnboarded: false, agent: 'Claude Code', model: '' });
  useSetupStore.setState({ integrations: [], managers: null, isChecking: false });
  useMachineStore.setState({ agents: [] });
  useAppStore.setState({ modal: null });
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
  it('opens on the welcome, and looks at the machine once on the way in', async () => {
    const check = vi.spyOn(window.qazinho, 'checkMachine');
    const { result, rerender } = renderHook(() => useOnboardingViewModel());

    rerender();

    expect(result.current.step).toBe('welcome');
    expect(result.current.isFirst).toBe(true);
    await waitFor(() => {
      expect(check).toHaveBeenCalledOnce();
    });
  });

  describe('dots', () => {
    it('marks the steps behind as done, and lets the QA go back to them only', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 2);

      expect(result.current.dots.map(({ state }) => state)).toEqual([
        'done',
        'done',
        'current',
        'todo',
        'todo',
      ]);
      expect(result.current.dots.map(({ canVisit }) => canVisit)).toEqual([
        true,
        true,
        false,
        false,
        false,
      ]);
    });

    it('goes back to a step that was done', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 3);
      act(() => {
        result.current.dots[1]?.onVisit();
      });

      expect(result.current.step).toBe('agents');
    });
  });

  describe('say', () => {
    it('greets the QA in the bubble, and holds the step until the line is out', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      expect(result.current.say).toContain('the Intern');
      expect(result.current.isSaid).toBe(false);

      act(() => {
        result.current.onSaid();
      });

      expect(result.current.isSaid).toBe(true);
    });

    it('says something new on the next step, and holds it again until said', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      act(() => {
        result.current.onSaid();
      });
      walkTo(result, 1);

      expect(result.current.isSaid).toBe(false);
    });

    it('says iOS cannot be tested on the devices step of a machine that is not a Mac', () => {
      window.qazinho = fakeQazinhoApi('linux');
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 2);

      expect(result.current.say).toContain(
        "iOS needs a Mac, so on this machine I can't test on iOS.",
      );
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

      expect(result.current.say).toBe(
        'Now the devices. The web needs nothing else. Android is ready: I found the SDK. iOS is ready too, with Xcode and idb.',
      );
    });

    it('owns up when there is no agent on this machine, looking suspicious', async () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 1);

      await waitFor(() => {
        expect(result.current.say).toContain("couldn't find an agent");
      });
      expect(result.current.mood).toBe('flaky');
    });
  });

  describe('nextLabel', () => {
    it('says the QA goes on without an agent when none is here', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 1);

      expect(result.current.nextLabel).toBe('Continue without an agent');
    });

    it('offers to skip the trackers while none is connected', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 3);

      expect(result.current.nextLabel).toBe('Skip for now');
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

    it('never walks past the last step', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 9);

      expect(result.current.step).toBe('done');
      expect(result.current.isLast).toBe(true);
    });
  });

  describe('finishing', () => {
    it('never shows again once skipped', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      act(() => {
        result.current.onSkipAll();
      });

      expect(useSettingsStore.getState().hasOnboarded).toBe(true);
    });

    it('opens the new project modal when the QA wants to start with one', () => {
      const { result } = renderHook(() => useOnboardingViewModel());

      walkTo(result, 4);
      act(() => {
        result.current.onCreateProject();
      });

      expect(useSettingsStore.getState().hasOnboarded).toBe(true);
      expect(useAppStore.getState().modal).toBe('project');
    });
  });
});
