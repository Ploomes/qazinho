// @vitest-environment jsdom
import type { StepVerdict } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlanCaseViewModel } from '@/modules/Plan/screens/Plan/components/PlanCase/hooks/usePlanCaseViewModel';
import { CASES } from '@/modules/Workspace/library/__tests__/fixtures';

const TEST_CASE = CASES[0]!;

const PROPS = {
  testCase: TEST_CASE,
  isOpen: false,
  isLocked: false,
  onToggle: vi.fn(),
  onEditCase: vi.fn(),
  onRemoveCase: vi.fn(),
  onMoveCase: vi.fn(),
  onAddStep: vi.fn(),
  onRemoveStep: vi.fn(),
  onEditStep: vi.fn(),
};

const ranStep = (props: {
  number: number;
  verdict: StepVerdict;
  by?: 'replay' | 'healed';
}) => ({
  action: `Step ${props.number}`,
  why: null,
  bugId: null,
  shot: null,
  shotFile: null,
  span: null,
  ...props,
});

const lastRunOf = (steps: ReturnType<typeof ranStep>[]) => ({
  id: TEST_CASE.id,
  title: TEST_CASE.title,
  verdict: 'passed' as const,
  durationSec: 4,
  steps,
});

describe('usePlanCaseViewModel', () => {
  it('numbers the steps as the list shows them', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(result.current.steps.map(({ number }) => number)).toEqual([1, 2, 3]);
  });

  it('links each step to the Figma frame its screen should match', () => {
    const design = {
      url: 'https://www.figma.com/design/AbC123/Shop?node-id=1-2',
      fileKey: 'AbC123',
      nodeId: '1:2',
      name: 'Shop',
    };
    const testCase = {
      ...TEST_CASE,
      steps: [{ ...TEST_CASE.steps[0]!, frame: '12:345' }, ...TEST_CASE.steps.slice(1)],
    };
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, testCase, design }),
    );

    expect(result.current.steps[0]?.frame).toEqual({
      label: 'frame 12:345',
      url: 'https://www.figma.com/design/AbC123/Shop?node-id=12-345',
      title: 'Open this frame in Figma',
    });
    expect(result.current.steps[1]?.frame).toBeNull();
  });

  it('does NOT link a frame once the workspace has no design', () => {
    const testCase = {
      ...TEST_CASE,
      steps: [{ ...TEST_CASE.steps[0]!, frame: '12:345' }],
    };

    expect(
      renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase, design: null })).result
        .current.steps[0]?.frame,
    ).toBeNull();
  });

  it('shows each step as it went in the last run', () => {
    const lastRun = {
      id: TEST_CASE.id,
      title: TEST_CASE.title,
      verdict: 'failed' as const,
      durationSec: 4,
      steps: [
        {
          number: 1,
          action: '',
          verdict: 'passed' as const,
          why: null,
          bugId: null,
          shot: null,
          shotFile: null,
          span: null,
        },
        {
          number: 2,
          action: '',
          verdict: 'failed' as const,
          why: null,
          bugId: null,
          shot: null,
          shotFile: null,
          span: null,
        },
      ],
    };
    const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

    expect(
      result.current.steps.map(({ verdict, verdictIcon }) => [verdict, verdictIcon]),
    ).toEqual([
      ['passed', 'passed'],
      ['failed', 'failed'],
      ['pending', 'pending'],
    ]);
  });

  it('does NOT invent a verdict for a case the last run never reached', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(
      result.current.steps.every(({ verdictLabel }) => verdictLabel === 'not run'),
    ).toBe(true);
  });

  it('reads a case that has never run as not run', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(result.current.verdict).toBe('pending');
  });

  it('asks for its own case to be toggled, not another', () => {
    const onToggle = vi.fn();
    const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, onToggle }));

    result.current.onHeadClick();

    expect(onToggle).toHaveBeenCalledWith('TC-01');
  });

  it('names its own case on every change it asks for', () => {
    const onEditStep = vi.fn();
    const onEditCase = vi.fn();
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, onEditStep, onEditCase }),
    );

    result.current.onStepCommit({ index: 1, step: { action: 'Search' } });
    result.current.onFieldCommit({ title: 'Search' });

    expect(onEditStep).toHaveBeenCalledWith({
      caseId: 'TC-01',
      index: 1,
      step: { action: 'Search' },
    });
    expect(onEditCase).toHaveBeenCalledWith({
      caseId: 'TC-01',
      fields: { title: 'Search' },
    });
  });

  it('does NOT offer to remove the only step a case has', () => {
    const oneStep = { ...TEST_CASE, steps: [TEST_CASE.steps[0]!] };
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, testCase: oneStep }),
    );

    expect(result.current.canRemoveStep).toBe(false);
  });

  it('does NOT offer to remove a step while the agent is running the plan', () => {
    const { result } = renderHook(() =>
      usePlanCaseViewModel({ ...PROPS, isLocked: true }),
    );

    expect(result.current.canRemoveStep).toBe(false);
  });

  describe('picking a case up', () => {
    it('lifts it as a sticker while it is dragged, and lays it flat once dropped', () => {
      const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

      expect(result.current.className).toBe('plan-case');

      act(() => {
        result.current.onPickUp();
      });

      expect(result.current.className).toBe('plan-case plan-case--picked');

      act(() => {
        result.current.onPutDown();
      });

      expect(result.current.className).toBe('plan-case');
    });
  });

  describe('onHeadKeyDown', () => {
    const key = (props: { key: string; altKey: boolean }) =>
      ({ ...props, preventDefault: vi.fn() }) as unknown as Parameters<
        ReturnType<typeof usePlanCaseViewModel>['onHeadKeyDown']
      >[0];

    /**
     * Arrastar era o único jeito de mover um caso, o que um teclado não consegue fazer.
     */
    it('moves the case up or down with Alt and an arrow', () => {
      const onMoveCase = vi.fn();
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, onMoveCase }));

      result.current.onHeadKeyDown(key({ key: 'ArrowUp', altKey: true }));
      result.current.onHeadKeyDown(key({ key: 'ArrowDown', altKey: true }));

      expect(onMoveCase.mock.calls).toEqual([
        [{ caseId: TEST_CASE.id, by: -1 }],
        [{ caseId: TEST_CASE.id, by: 1 }],
      ]);
    });

    it('does NOT move it on a bare arrow, nor while a run walks the plan', () => {
      const onMoveCase = vi.fn();
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, onMoveCase }));

      result.current.onHeadKeyDown(key({ key: 'ArrowUp', altKey: false }));

      const locked = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, isLocked: true, onMoveCase }),
      );

      locked.result.current.onHeadKeyDown(key({ key: 'ArrowUp', altKey: true }));

      expect(onMoveCase).not.toHaveBeenCalled();
    });
  });

  describe('the cursor', () => {
    it('lands in the title of a case just added', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, isFresh: true }),
      );

      expect(result.current.isTitleFocused).toBe(true);
    });

    it('does NOT jump to a case that was already there', () => {
      const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

      expect(result.current.isTitleFocused).toBe(false);
      expect(result.current.steps.some(({ isFresh }) => isFresh)).toBe(false);
    });

    it('lands in the step just added, the one after the last', () => {
      const { result, rerender } = renderHook((props) => usePlanCaseViewModel(props), {
        initialProps: PROPS,
      });

      act(() => {
        result.current.onStepAdd();
      });
      rerender({
        ...PROPS,
        testCase: {
          ...TEST_CASE,
          steps: [...TEST_CASE.steps, { action: '', expected: '' }],
        },
      });

      expect(result.current.steps.map(({ isFresh }) => isFresh)).toEqual([
        false,
        false,
        false,
        true,
      ]);
    });
  });
  describe('the last run, in a sentence', () => {
    it('says every step passed, and that it ran with no AI', () => {
      const lastRun = lastRunOf(
        [1, 2, 3].map((number) => ranStep({ number, verdict: 'passed', by: 'replay' })),
      );
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

      expect(result.current.summary).toEqual({
        tone: 'passed',
        text: 'All 3 steps passed in the last run',
        note: 'no AI',
      });
    });

    it('says a step was healed over a run with no AI', () => {
      const lastRun = lastRunOf([
        ranStep({ number: 1, verdict: 'passed', by: 'replay' }),
        ranStep({ number: 2, verdict: 'passed', by: 'healed' }),
      ]);
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

      expect(result.current.summary?.note).toBe('healed');
    });

    it('names the step it failed at, of how many, and what it did there', () => {
      const lastRun = lastRunOf([
        ranStep({ number: 1, verdict: 'passed' }),
        ranStep({ number: 2, verdict: 'failed' }),
        ranStep({ number: 3, verdict: 'skipped' }),
      ]);
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

      expect(result.current.summary).toEqual({
        tone: 'failed',
        text: 'Failed at step 2 of 3: Step 2',
        note: null,
      });
    });

    it('does NOT sum up a case that never ran', () => {
      expect(
        renderHook(() => usePlanCaseViewModel(PROPS)).result.current.summary,
      ).toBeNull();
    });
  });

  describe('each step', () => {
    it('shows a verdict only where the step did not pass', () => {
      const lastRun = lastRunOf([
        ranStep({ number: 1, verdict: 'passed' }),
        ranStep({ number: 2, verdict: 'failed' }),
        ranStep({ number: 3, verdict: 'skipped' }),
      ]);
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

      expect(
        result.current.steps.map(({ isVerdictShown, verdictLabel }) => [
          isVerdictShown,
          verdictLabel,
        ]),
      ).toEqual([
        [false, 'passed'],
        [true, 'failed'],
        [true, 'not reached'],
      ]);
    });

    it('does NOT mark the steps of a case that never ran', () => {
      const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

      expect(result.current.steps.some(({ isVerdictShown }) => isVerdictShown)).toBe(
        false,
      );
    });
  });

  describe('the priority', () => {
    it('stands out only on a P1 case', () => {
      const p1 = { ...TEST_CASE, priority: 'P1' as const };
      const p2 = { ...TEST_CASE, priority: 'P2' as const };

      expect(
        renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase: p1 })).result.current
          .priority,
      ).toBe('P1');
      expect(
        renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase: p2 })).result.current
          .priority,
      ).toBeNull();
    });
  });
});
