// @vitest-environment jsdom
import type { IRunButtonProps } from '@/modules/Workspace/screens/Workspace/components/RunButton/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEYBINDS } from '@/modules/Settings/constants';
import { useRunButtonViewModel } from '@/modules/Workspace/screens/Workspace/components/RunButton/hooks/useRunButtonViewModel';
import { useSettingsStore } from '@/store';

function render(props: Partial<IRunButtonProps> = {}) {
  const onRun = vi.fn();
  const onRunPlan = vi.fn();
  const onRunDeveloped = vi.fn();
  const onRunWithAgent = vi.fn();
  const view = renderHook(() =>
    useRunButtonViewModel({
      canRun: true,
      canChoose: true,
      developed: 3,
      toDevelop: 0,
      toContinue: 0,
      onRun,
      onRunPlan,
      onRunDeveloped,
      onRunWithAgent,
      ...props,
    }),
  );

  return { onRun, onRunPlan, onRunDeveloped, onRunWithAgent, result: view.result };
}

afterEach(() => {
  useSettingsStore.setState({ keybinds: KEYBINDS });
});

describe('useRunButtonViewModel', () => {
  describe('a run the app closed in the middle of', () => {
    it('offers to continue on its face, saying how many cases are left', () => {
      const { result } = render({ toContinue: 6 });

      expect(result.current.runLabel).toBe('Continue');
      expect(result.current.tip).toContain('6 cases left');
      expect(result.current.options[0]?.key).toBe('continue');
    });

    it('continues from the first option, and starts over from the plan option', () => {
      const { onRun, onRunPlan, result } = render({ toContinue: 1 });

      result.current.options.find(({ key }) => key === 'continue')?.onPick();
      expect(onRun).toHaveBeenCalledOnce();
      expect(onRunPlan).not.toHaveBeenCalled();

      result.current.options.find(({ key }) => key === 'plan')?.onPick();
      expect(onRunPlan).toHaveBeenCalledOnce();
    });

    it('does NOT offer to redo every case while none is developed', () => {
      const { result } = render({ developed: 0, toDevelop: 4, toContinue: 2 });

      expect(result.current.options.map(({ key }) => key)).toEqual(['continue', 'plan']);
    });
  });

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

    it('says why it cannot run, and what it does once it can', () => {
      expect(render({ canRun: false }).result.current.tip).toBe(
        'The plan has no step to run yet: write one in the Plan tab, or draft it in the chat.',
      );
      expect(render().result.current.tip).toBe(
        'The recording walks by itself, in seconds and with no tokens spent. The agent only steps in if the app changed.',
      );
    });

    it('names the stage the plan is in', () => {
      expect(render({ developed: 0, toDevelop: 5 }).result.current.runLabel).toBe(
        'Develop plan',
      );
      expect(render({ developed: 2, toDevelop: 3 }).result.current.runLabel).toBe(
        'Develop 3 cases',
      );
      expect(render({ developed: 4, toDevelop: 1 }).result.current.runLabel).toBe(
        'Develop 1 case',
      );
      expect(render({ developed: 5, toDevelop: 0 }).result.current.runLabel).toBe(
        'Run plan',
      );
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

    /**
     * Antes de qualquer caso ser gravado não há nada a andar de novo sem o agente: os dois
     * jeitos são o mesmo.
     */
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
        hint: 'The recording walks by itself, in seconds and with no tokens spent. The agent only steps in if the app changed.',
        combo: '⌘↵',
      });
      expect(agent).toMatchObject({
        title: 'Develop everything again',
        hint: 'The agent walks every case and records it again. It takes longer and uses more tokens.',
        combo: null,
      });
    });

    it('offers to run what is developed while some cases are left', () => {
      const { onRunDeveloped, result } = render({ developed: 2, toDevelop: 3 });

      expect(result.current.options.map(({ key }) => key)).toEqual([
        'plan',
        'developed',
        'agent',
      ]);
      expect(result.current.options[1]?.title).toBe('Run 2 developed cases');

      act(() => {
        result.current.options[1]?.onPick();
      });

      expect(onRunDeveloped).toHaveBeenCalledOnce();
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
