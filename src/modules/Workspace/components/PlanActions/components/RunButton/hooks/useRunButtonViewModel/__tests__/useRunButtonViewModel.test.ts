// @vitest-environment jsdom
import type { IRunButtonProps } from '@/modules/Workspace/components/PlanActions/components/RunButton/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEYBINDS } from '@/modules/Settings/constants';
import { useRunButtonViewModel } from '@/modules/Workspace/components/PlanActions/components/RunButton/hooks/useRunButtonViewModel';
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

  /**
   * Um plano escrito antes do app espera a história chegar para teste: o botão diz isso,
   * e desenvolver mesmo assim é uma escolha no menu, que diz o que vai acontecer.
   */
  describe('a plan waiting for its story to arrive', () => {
    it('says it waits for the app, and why on hover', () => {
      const { result } = render({ developed: 0, toDevelop: 3, waitsFor: 'SHOP-878' });

      expect(result.current).toMatchObject({
        runLabel: 'Waiting for the app',
        tip: 'SHOP-878 has not arrived for testing yet.',
        hasChoices: true,
      });
      expect(result.current.className).toContain('run-button--waiting');
    });

    it('opens the menu instead of developing, and develops from Develop now', () => {
      const { onRun, onRunPlan, result } = render({
        canChoose: false,
        developed: 0,
        toDevelop: 3,
        waitsFor: 'SHOP-878',
      });

      act(() => {
        result.current.onRun();
      });

      expect(onRun).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true);

      const now = result.current.options.find(({ key }) => key === 'plan');

      expect(now).toMatchObject({
        title: 'Develop now',
        hint: 'The agent walks the app as it is today.',
      });

      act(() => {
        now?.onPick();
      });

      expect(onRunPlan).toHaveBeenCalledOnce();
    });

    it('does NOT wait once every case is developed, or to continue a run', () => {
      expect(render({ waitsFor: 'SHOP-878' }).result.current.runLabel).toBe('Run plan');
      expect(
        render({ toDevelop: 2, toContinue: 2, waitsFor: 'SHOP-878' }).result.current
          .runLabel,
      ).toBe('Continue');
    });
  });

  /** Um plano escrito de uma história antes do app: desenvolver começa por dizer onde ele roda. */
  describe('a plan with no app yet', () => {
    it('asks for the app on its face, and opens where the QA says it', () => {
      const onPickApp = vi.fn();
      const { onRun, onRunPlan, result } = render({
        developed: 0,
        toDevelop: 3,
        waitsFor: 'SHOP-878',
        needsApp: true,
        onPickApp,
      });

      expect(result.current).toMatchObject({
        runLabel: 'Choose the app',
        tip: 'Say where the app runs, then develop the plan.',
        hasChoices: false,
      });

      act(() => {
        result.current.onRun();
      });

      expect(onPickApp).toHaveBeenCalledOnce();
      expect(onRun).not.toHaveBeenCalled();
      expect(onRunPlan).not.toHaveBeenCalled();
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
