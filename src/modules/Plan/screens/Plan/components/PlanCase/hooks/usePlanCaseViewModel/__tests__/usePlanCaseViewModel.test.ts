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
  why?: string | null;
  bugId?: string | null;
}) => ({
  action: `Step ${props.number}`,
  why: null as string | null,
  bugId: null as string | null,
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

    expect(result.current.steps.map(({ verdict, isBad }) => [verdict, isBad])).toEqual([
      ['passed', false],
      ['failed', true],
      ['pending', false],
    ]);
  });

  it('does NOT invent a verdict for a case the last run never reached', () => {
    const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

    expect(result.current.steps.every(({ verdict }) => verdict === 'pending')).toBe(true);
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

  /** O normal fica quieto: um caso que passou ou já tem gravação não leva marca. */
  describe('the status beside the case', () => {
    const statusOf = (over: { lastVerdict?: StepVerdict; isDeveloped?: boolean }) =>
      renderHook(() =>
        usePlanCaseViewModel({
          ...PROPS,
          testCase: { ...TEST_CASE, lastVerdict: over.lastVerdict ?? null },
          isDeveloped: over.isDeveloped,
        }),
      ).result.current;

    it('shows nothing on a case that passed', () => {
      expect(statusOf({ lastVerdict: 'passed', isDeveloped: true }).hasStatus).toBe(
        false,
      );
    });

    it('shows nothing on a case with a recording that has not run yet', () => {
      expect(statusOf({ isDeveloped: true }).hasStatus).toBe(false);
    });

    it('marks a case that still has no recording', () => {
      expect(statusOf({ isDeveloped: false })).toMatchObject({
        hasStatus: true,
        verdict: 'pending',
      });
    });

    it('marks a case that failed, recorded or not', () => {
      expect(statusOf({ lastVerdict: 'failed', isDeveloped: true })).toMatchObject({
        hasStatus: true,
        verdict: 'failed',
      });
    });
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
  /** O motivo ao lado do caso diz onde ele parou, ou que falta gravá-lo, e nada mais. */
  describe('the reason beside the case', () => {
    it('names the step it failed at', () => {
      const lastRun = lastRunOf([
        ranStep({ number: 1, verdict: 'passed' }),
        ranStep({ number: 2, verdict: 'failed' }),
        ranStep({ number: 3, verdict: 'skipped' }),
      ]);
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, lastRun, isDeveloped: true }),
      );

      expect(result.current.reason).toBe('step 2');
    });

    it('names the step it was blocked at', () => {
      const lastRun = lastRunOf([ranStep({ number: 1, verdict: 'blocked' })]);
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

      expect(result.current.reason).toBe('step 1');
    });

    it('says a case with no recording is still to develop', () => {
      expect(renderHook(() => usePlanCaseViewModel(PROPS)).result.current.reason).toBe(
        'to develop',
      );
    });

    it('says nothing on a recorded case that passed', () => {
      const lastRun = lastRunOf(
        [1, 2, 3].map((number) => ranStep({ number, verdict: 'passed', by: 'replay' })),
      );
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, lastRun, isDeveloped: true }),
      );

      expect(result.current.reason).toBe('');
    });

    it('says a case the QA walks by hand is done by hand, with no status beside it', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, testCase: { ...TEST_CASE, isManual: true } }),
      );

      expect(result.current).toMatchObject({
        reason: 'by hand',
        hasStatus: false,
        runCaseLabel: 'Walk this case by hand',
        runIcon: 'manual',
      });
    });

    it('does NOT give a reason while the run walks the case', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, liveStatus: 'running' }),
      );

      expect(result.current.reason).toBe('');
    });

    /**
     * Um caso cuja resposta esperada depende de uma dúvida que ninguém aqui sabe responder
     * espera o time: dizer "passo 2" ou "por desenvolver" esconderia por que ele está assim.
     */
    it('says what doubts a case waits on, before anything else, in the color of a question', () => {
      const lastRun = lastRunOf([ranStep({ number: 1, verdict: 'failed' })]);
      const { result } = renderHook(() =>
        usePlanCaseViewModel({
          ...PROPS,
          lastRun,
          testCase: { ...TEST_CASE, blockedBy: ['D1', 'D3'] },
        }),
      );

      expect(result.current).toMatchObject({
        reason: 'waits on D1 and D3',
        reasonClassName: 'plan-case__reason plan-case__reason--waits',
      });
    });
  });

  describe('a case a proposed swap touches', () => {
    it('says it is to review, with why on hover', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, changeWhy: 'C3 diz 5 tentativas' }),
      );

      expect(result.current).toMatchObject({
        reason: 'to review',
        reasonTip: 'C3 diz 5 tentativas',
        reasonClassName: 'plan-case__reason plan-case__reason--waits',
      });
    });

    it('says nothing of it while the run walks the case', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, changeWhy: 'C3', liveStatus: 'running' }),
      );

      expect(result.current).toMatchObject({ reason: '', reasonTip: undefined });
    });
  });

  describe('where a case came from', () => {
    it('names the criteria and sources the agent wrote it from', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({
          ...PROPS,
          testCase: { ...TEST_CASE, sources: ['C1', 'C3', 'SHOP-878'] },
        }),
      );

      expect(result.current.sources).toBe(
        'Source: criterion 1, criterion 3, and SHOP-878',
      );
    });

    it('says nothing for a case written with no source', () => {
      expect(
        renderHook(() => usePlanCaseViewModel(PROPS)).result.current.sources,
      ).toBeNull();
    });
  });

  describe('the goal and the precondition', () => {
    const EMPTY = { ...TEST_CASE, goal: '', preconditions: '' };

    it('shows the ones the case has, and offers to add the others', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({
          ...PROPS,
          testCase: { ...EMPTY, goal: 'Prove the cart totals' },
        }),
      );

      expect(result.current).toMatchObject({
        isGoalShown: true,
        isBeforeShown: false,
        canAddGoal: false,
        canAddBefore: true,
      });
    });

    it('does NOT show an empty field: it offers to add it instead', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, testCase: EMPTY }),
      );

      expect(result.current).toMatchObject({
        isGoalShown: false,
        isBeforeShown: false,
        canAddGoal: true,
        canAddBefore: true,
      });
    });

    it('opens the field the QA adds, with the cursor in it, and stops offering it', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, testCase: EMPTY }),
      );

      act(() => {
        result.current.onFactAdd('before');
      });

      expect(result.current).toMatchObject({
        isBeforeShown: true,
        isBeforeFocused: true,
        canAddBefore: false,
        isGoalShown: false,
        canAddGoal: true,
      });
    });

    it('does NOT put the cursor in a field that already has text', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({
          ...PROPS,
          testCase: { ...EMPTY, goal: 'Prove the cart totals' },
        }),
      );

      act(() => {
        result.current.onFactAdd('goal');
      });

      expect(result.current.isGoalFocused).toBe(false);
    });

    it('forgets an empty field the QA opened once the case is folded', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, testCase: EMPTY }),
      );

      act(() => {
        result.current.onFactAdd('goal');
      });
      act(() => {
        result.current.onHeadClick();
      });

      expect(result.current).toMatchObject({ isGoalShown: false, canAddGoal: true });
    });

    it('does NOT offer to add a field while the agent runs the plan, nor show an empty one', () => {
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, testCase: EMPTY, isLocked: true }),
      );

      expect(result.current).toMatchObject({
        isGoalShown: false,
        isBeforeShown: false,
        canAddGoal: false,
        canAddBefore: false,
      });
    });
  });

  describe('the open case', () => {
    it('is marked open while it shows its steps, and plain once folded', () => {
      expect(
        renderHook(() => usePlanCaseViewModel({ ...PROPS, isOpen: true })).result.current
          .className,
      ).toBe('plan-case plan-case--open');
      expect(renderHook(() => usePlanCaseViewModel(PROPS)).result.current.className).toBe(
        'plan-case',
      );
    });
  });

  describe('each step', () => {
    it('says what came where the step did not pass, and where the run never got', () => {
      const lastRun = lastRunOf([
        ranStep({ number: 1, verdict: 'passed' }),
        ranStep({ number: 2, verdict: 'failed', why: 'The total took 40% off' }),
        ranStep({ number: 3, verdict: 'skipped' }),
      ]);
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

      expect(
        result.current.steps.map(({ isBad, hasGotPrefix, got, isUnreached }) => [
          isBad,
          isBad && hasGotPrefix ? got : '',
          isUnreached,
        ]),
      ).toEqual([
        [false, '', false],
        [true, 'The total took 40% off', false],
        [false, '', true],
      ]);
    });

    it('names the verdict when the agent gave no reason', () => {
      const lastRun = lastRunOf([ranStep({ number: 1, verdict: 'failed' })]);
      const { result } = renderHook(() => usePlanCaseViewModel({ ...PROPS, lastRun }));

      expect(result.current.steps[0]).toMatchObject({
        isBad: true,
        hasGotPrefix: false,
        got: 'failed',
      });
    });

    it('opens the bug the step left, when the plan can show it', () => {
      const onOpenBug = vi.fn();
      const lastRun = lastRunOf([
        ranStep({ number: 1, verdict: 'failed', bugId: 'BUG-03' }),
      ]);
      const { result } = renderHook(() =>
        usePlanCaseViewModel({ ...PROPS, lastRun, onOpenBug }),
      );

      expect(result.current.steps[0]?.hasBug).toBe(true);

      act(() => {
        result.current.steps[0]?.onBugClick();
      });

      expect(onOpenBug).toHaveBeenCalledWith('BUG-03');
    });

    it('does NOT mark the steps of a case that never ran', () => {
      const { result } = renderHook(() => usePlanCaseViewModel(PROPS));

      expect(
        result.current.steps.some(({ isBad, isUnreached }) => isBad || isUnreached),
      ).toBe(false);
    });

    it('hides an empty expected result once the plan is locked', () => {
      const testCase = {
        ...TEST_CASE,
        steps: [{ action: 'Open the cart', expected: '' }],
      };

      expect(
        renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase })).result.current
          .steps[0]?.hasExpected,
      ).toBe(true);
      expect(
        renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase, isLocked: true }))
          .result.current.steps[0]?.hasExpected,
      ).toBe(false);
    });
  });

  describe('the priority', () => {
    it('stands out only on a P1 case', () => {
      const p1 = { ...TEST_CASE, priority: 'P1' as const };
      const p2 = { ...TEST_CASE, priority: 'P2' as const };
      const priorityOf = (testCase: typeof p1 | typeof p2) =>
        renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase, isDeveloped: true }))
          .result.current.priority;

      expect(priorityOf(p1)).toBe('P1');
      expect(priorityOf(p2)).toBeNull();
    });

    it('gives way to the reason, one thing beside a case', () => {
      const p1 = { ...TEST_CASE, priority: 'P1' as const };

      expect(
        renderHook(() => usePlanCaseViewModel({ ...PROPS, testCase: p1 })).result.current
          .priority,
      ).toBeNull();
    });
  });

  describe('walking a case by hand', () => {
    it('marks an automated case as one the QA walks by hand, and back', () => {
      const onEditCase = vi.fn();
      const automated = renderHook(() => usePlanCaseViewModel({ ...PROPS, onEditCase }));

      expect(automated.result.current.manualLabel).toBe('Walk it by hand');

      act(() => {
        automated.result.current.onManualToggle();
      });

      expect(onEditCase).toHaveBeenLastCalledWith({
        caseId: TEST_CASE.id,
        fields: { isManual: true },
      });

      const manual = renderHook(() =>
        usePlanCaseViewModel({
          ...PROPS,
          testCase: { ...TEST_CASE, isManual: true },
          onEditCase,
        }),
      );

      expect(manual.result.current.manualLabel).toBe('Automate it');

      act(() => {
        manual.result.current.onManualToggle();
      });

      expect(onEditCase).toHaveBeenLastCalledWith({
        caseId: TEST_CASE.id,
        fields: { isManual: false },
      });
    });
  });
});

describe('usePlanCaseViewModel, the account a case starts in', () => {
  it('shows the account and offers the others and starting signed out', () => {
    const onEditCase = vi.fn();
    const { result } = renderHook(() =>
      usePlanCaseViewModel({
        ...PROPS,
        testCase: { ...TEST_CASE, signedInAs: 'LOGIN_EMAIL' },
        accounts: ['LOGIN_EMAIL', 'ADMIN_EMAIL'],
        onEditCase,
      }),
    );

    expect(result.current.isAccountShown).toBe(true);
    expect(result.current.hasFacts).toBe(true);
    expect(result.current.accountLabel).toBe('LOGIN_EMAIL');
    expect(result.current.accountItems.map(({ key }) => key)).toEqual([
      'LOGIN_EMAIL',
      'ADMIN_EMAIL',
      '~none',
    ]);

    act(() => {
      result.current.accountItems[1]?.onPick();
    });
    expect(onEditCase).toHaveBeenLastCalledWith({
      caseId: TEST_CASE.id,
      fields: { signedInAs: 'ADMIN_EMAIL' },
    });

    act(() => {
      result.current.accountItems[2]?.onPick();
    });
    expect(onEditCase).toHaveBeenLastCalledWith({
      caseId: TEST_CASE.id,
      fields: { signedInAs: undefined },
    });
  });

  it('offers to start signed in only when the project keeps an account', () => {
    const { result, rerender } = renderHook(
      (accounts: string[]) => usePlanCaseViewModel({ ...PROPS, accounts }),
      { initialProps: [] as string[] },
    );

    expect(result.current.canAddAccount).toBe(false);

    rerender(['LOGIN_EMAIL']);
    expect(result.current.canAddAccount).toBe(true);
    expect(result.current.isAccountShown).toBe(false);

    act(() => {
      result.current.onFactAdd('account');
    });
    expect(result.current.isAccountShown).toBe(true);
    expect(result.current.canAddAccount).toBe(false);
    expect(result.current.accountItems.map(({ key }) => key)).toEqual(['LOGIN_EMAIL']);
  });

  it('keeps an account the project no longer lists, and does NOT let a locked plan pick', () => {
    const { result } = renderHook(() =>
      usePlanCaseViewModel({
        ...PROPS,
        isLocked: true,
        testCase: { ...TEST_CASE, signedInAs: 'OLD_EMAIL' },
        accounts: [],
      }),
    );

    expect(result.current.canPickAccount).toBe(false);
    expect(result.current.accountLabel).toBe('OLD_EMAIL');
    expect(result.current.canAddAccount).toBe(false);
  });
});
