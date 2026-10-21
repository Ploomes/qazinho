// @vitest-environment jsdom
import type { IRunButtonProps } from '@/modules/Workspace/screens/Workspace/components/RunButton/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEYBINDS } from '@/modules/Settings/constants';
import { useRunButtonViewModel } from '@/modules/Workspace/screens/Workspace/components/RunButton/hooks/useRunButtonViewModel';
import { useSettingsStore } from '@/store';

function render(props: Partial<IRunButtonProps> = {}) {
  const onRun = vi.fn();
  const onRunWithAgent = vi.fn();
  const view = renderHook(() =>
    useRunButtonViewModel({
      canRun: true,
      canChoose: true,
      onRun,
      onRunWithAgent,
      ...props,
    }),
  );

  return { onRun, onRunWithAgent, result: view.result };
}

afterEach(() => {
  useSettingsStore.setState({ keybinds: KEYBINDS });
});

describe('useRunButtonViewModel', () => {
  describe('onRun', () => {
    it('runs the plan from the face of the button', () => {
      const { onRun, onRunWithAgent, result } = render();

      result.current.onRun();

      expect(onRun).toHaveBeenCalledOnce();
      expect(onRunWithAgent).not.toHaveBeenCalled();
    });

    it('does NOT run a plan that cannot run yet', () => {
      const { onRun, result } = render({ canRun: false });

      result.current.onRun();

      expect(onRun).not.toHaveBeenCalled();
      expect(result.current).toMatchObject({
        isDisabled: true,
        className: 'run-button run-button--disabled',
      });
    });
  });

  describe('onToggle', () => {
    it('opens the two ways to run, and shuts them again', () => {
      const { result } = render();

      act(() => {
        result.current.onToggle();
      });

      expect(result.current).toMatchObject({
        isOpen: true,
        className: 'run-button run-button--open',
        caretClassName: 'run-button__caret run-button__caret--open',
      });

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    /** Before any case passed there is nothing to walk again without the agent: both ways are the same. */
    it('offers no choice before a case passed', () => {
      const { result } = render({ canChoose: false });

      act(() => {
        result.current.onToggle();
      });

      expect(result.current).toMatchObject({ hasChoices: false, isOpen: false });
    });

    it('does NOT open while the plan cannot run', () => {
      const { result } = render({ canRun: false });

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('options', () => {
    it('says what each way does, the usual one first with its shortcut', () => {
      const [plan, agent] = render().result.current.options;

      expect(plan).toMatchObject({
        title: 'Run plan',
        hint: 'What passed before runs again without AI, in seconds. The agent walks and judges the rest.',
        combo: '⌘↵',
      });
      expect(agent).toMatchObject({
        title: 'Run everything with the agent',
        hint: 'The agent walks and judges every case again, even the ones that passed. Slower, and it spends tokens.',
        combo: null,
      });
    });

    it('shows the shortcut the QA bound, not the one it came with', () => {
      useSettingsStore.setState({
        keybinds: KEYBINDS.map((keybind) =>
          keybind.id === 'run' ? { ...keybind, combo: '⌘R' } : keybind,
        ),
      });

      expect(render().result.current.options[0]?.combo).toBe('⌘R');
    });

    it('runs the way picked and shuts the menu', () => {
      const { onRun, onRunWithAgent, result } = render();

      act(() => {
        result.current.onToggle();
      });
      act(() => {
        result.current.options[1]?.onPick();
      });

      expect(onRunWithAgent).toHaveBeenCalledOnce();
      expect(onRun).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(false);
    });
  });
});
